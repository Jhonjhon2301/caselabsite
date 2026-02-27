import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ORIGIN_CEP = "72005247";
const WEIGHT_KG = 0.85;
const HEIGHT_CM = 10;
const WIDTH_CM = 20;
const LENGTH_CM = 25;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("MELHOR_ENVIO_TOKEN");
    if (!token) throw new Error("MELHOR_ENVIO_TOKEN não configurado");

    const { cep, subtotal } = await req.json();
    if (!cep) throw new Error("CEP é obrigatório");

    const destCep = cep.replace(/\D/g, "");
    if (destCep.length !== 8) throw new Error("CEP inválido");

    // Detect UF via ViaCEP
    let uf = "";
    try {
      const viaRes = await fetch(`https://viacep.com.br/ws/${destCep}/json/`);
      const viaData = await viaRes.json();
      if (!viaData.erro) {
        uf = viaData.uf || "";
      }
    } catch {
      // fallback: will check from melhor envio response
    }

    const isDF = uf === "DF";
    const freeThreshold = isDF ? 180 : 200;
    const isFreeShipping = subtotal >= freeThreshold;
    const missingForFree = Math.max(0, freeThreshold - subtotal);

    // Calculate shipping via Melhor Envio
    const meBody = {
      from: { postal_code: ORIGIN_CEP },
      to: { postal_code: destCep },
      products: [
        {
          id: "1",
          width: WIDTH_CM,
          height: HEIGHT_CM,
          length: LENGTH_CM,
          weight: WEIGHT_KG,
          insurance_value: subtotal,
          quantity: 1,
        },
      ],
    };

    const meRes = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "CaseLab contato@caselab.com.br",
      },
      body: JSON.stringify(meBody),
    });

    const meData = await meRes.json();

    // Filter valid options (no error, has price)
    const validOptions = (Array.isArray(meData) ? meData : [])
      .filter((opt: any) => !opt.error && opt.price && Number(opt.price) > 0)
      .map((opt: any) => ({
        id: opt.id,
        name: opt.name,
        company: opt.company?.name || "",
        price: Number(opt.price),
        delivery_time: opt.delivery_time || opt.delivery_range?.max || 0,
        currency: opt.currency || "BRL",
      }))
      .sort((a: any, b: any) => a.price - b.price);

    if (validOptions.length === 0) {
      throw new Error("Nenhuma opção de frete disponível para este CEP");
    }

    // Pick cheapest
    const best = validOptions[0];

    // Build free shipping message
    let freeShippingMessage = "";
    if (isFreeShipping) {
      freeShippingMessage = "Você ganhou frete grátis! 🚚";
    } else if (isDF) {
      freeShippingMessage = `Faltam R$${missingForFree.toFixed(2).replace(".", ",")} para ganhar frete grátis em Brasília 🎁`;
    } else {
      freeShippingMessage = `Faltam R$${missingForFree.toFixed(2).replace(".", ",")} para ganhar frete grátis 🎁`;
    }

    return new Response(
      JSON.stringify({
        shipping_cost: isFreeShipping ? 0 : best.price,
        shipping_original_cost: best.price,
        shipping_carrier: best.company,
        shipping_service: best.name,
        shipping_estimated_days: best.delivery_time,
        is_free_shipping: isFreeShipping,
        free_shipping_message: freeShippingMessage,
        uf,
        all_options: validOptions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Shipping calc error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
