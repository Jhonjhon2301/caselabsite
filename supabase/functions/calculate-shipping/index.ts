import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ORIGIN_CEP = "72005247";

// Single bottle dimensions
const UNIT_HEIGHT_CM = 27;
const UNIT_WIDTH_CM = 11.5;
const UNIT_DEPTH_CM = 11.5; // depth stacks when multiple
const UNIT_WEIGHT_KG = 0.85;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = Deno.env.get("MELHOR_ENVIO_TOKEN");
    if (!token) throw new Error("MELHOR_ENVIO_TOKEN não configurado");

    const { cep, subtotal, totalQuantity } = await req.json();
    if (!cep) throw new Error("CEP é obrigatório");

    const destCep = cep.replace(/\D/g, "");
    if (destCep.length !== 8) throw new Error("CEP inválido");

    const qty = Math.max(1, totalQuantity || 1);

    // Fetch shipping config from site_settings (margin)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let marginType = "fixed"; // "fixed" | "percentage"
    let marginValue = 0;

    try {
      const { data: settingsData } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "shipping_config")
        .single();

      if (settingsData?.value) {
        const cfg = settingsData.value as any;
        marginType = cfg.margin_type || "fixed";
        marginValue = Number(cfg.margin_value) || 0;
      }
    } catch {}

    // Detect UF via ViaCEP
    let uf = "";
    try {
      const viaRes = await fetch(`https://viacep.com.br/ws/${destCep}/json/`);
      const viaData = await viaRes.json();
      if (!viaData.erro) {
        uf = viaData.uf || "";
      }
    } catch {}

    const isDF = uf === "DF";
    const freeThreshold = isDF ? 180 : 200;
    const isFreeShipping = subtotal >= freeThreshold;
    const missingForFree = Math.max(0, freeThreshold - subtotal);

    // All bottles in one box: height & width fixed, depth stacks, weight sums
    const products = [
      {
        id: "1",
        width: UNIT_WIDTH_CM,
        height: UNIT_HEIGHT_CM,
        length: UNIT_DEPTH_CM * qty,
        weight: UNIT_WEIGHT_KG * qty,
        insurance_value: subtotal,
        quantity: 1,
      },
    ];

    const meBody = {
      from: { postal_code: ORIGIN_CEP },
      to: { postal_code: destCep },
      products,
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

    // Filter valid options
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

    const best = validOptions[0];

    // Apply margin
    let finalPrice = best.price;
    if (marginValue > 0) {
      if (marginType === "percentage") {
        finalPrice = best.price * (1 + marginValue / 100);
      } else {
        finalPrice = best.price + marginValue;
      }
    }
    finalPrice = Math.round(finalPrice * 100) / 100;

    // Free shipping message
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
        shipping_cost: isFreeShipping ? 0 : finalPrice,
        shipping_original_cost: best.price,
        shipping_carrier: best.company,
        shipping_service: best.name,
        shipping_estimated_days: best.delivery_time,
        is_free_shipping: isFreeShipping,
        free_shipping_message: freeShippingMessage,
        uf,
        total_boxes: qty,
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
