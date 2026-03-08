import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Produção ativa com certificado válido até 03/03/2027
const FOCUS_BASE_URL = "https://api.focusnfe.com.br";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const FOCUS_TOKEN = Deno.env.get("FOCUS_NFE_TOKEN");
  const FOCUS_ISSUER_CNPJ = (Deno.env.get("FOCUS_ISSUER_CNPJ") || "").replace(/\D/g, "");
  if (!FOCUS_TOKEN) {
    return new Response(JSON.stringify({ error: "FOCUS_NFE_TOKEN não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id é obrigatório");

    // Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) throw new Error("Pedido não encontrado");

    // Check if NF-e already emitted for this order
    const { data: existing } = await supabaseAdmin
      .from("fiscal_notes")
      .select("id")
      .eq("order_id", order_id)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ success: true, message: "NF-e já emitida para este pedido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order items
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    if (!items || items.length === 0) throw new Error("Pedido sem itens");

    // Update order payment status
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed" })
      .eq("id", order_id);

    const ref = `NF-${Date.now().toString(36).toUpperCase()}`;
    const authB64 = btoa(`${FOCUS_TOKEN}:`);

    // Build NF-e payload
    const nfeData: Record<string, any> = {
      natureza_operacao: "Venda de mercadoria",
      forma_pagamento: "0",
      tipo_documento: "1",
      finalidade_emissao: "1",
      consumidor_final: "1",
      presenca_comprador: "9",
      nome_destinatario: order.customer_name || "CONSUMIDOR FINAL",
      cpf_destinatario: order.customer_cpf?.replace(/\D/g, "") || undefined,
      indicador_inscricao_estadual_destinatario: "9",
      items: items.map((item: any, idx: number) => ({
        numero_item: idx + 1,
        codigo_produto: item.product_id || `PROD-${idx + 1}`,
        descricao: item.product_name,
        quantidade_comercial: item.quantity.toFixed(4),
        quantidade_tributavel: item.quantity.toFixed(4),
        valor_unitario_comercial: Number(item.unit_price).toFixed(2),
        valor_unitario_tributavel: Number(item.unit_price).toFixed(2),
        valor_bruto: (Number(item.unit_price) * item.quantity).toFixed(2),
        unidade_comercial: "UN",
        unidade_tributavel: "UN",
        codigo_ncm: "7323.93.00",
        cfop: "5102",
        icms_situacao_tributaria: "102",
        icms_origem: "0",
        pis_situacao_tributaria: "07",
        cofins_situacao_tributaria: "07",
      })),
      formas_pagamento: [
        {
          tipo_pagamento: "01",
          valor_pagamento: Number(order.total).toFixed(2),
        },
      ],
    };

    // Send email to customer
    if (order.customer_email) {
      nfeData.email_destinatario = order.customer_email;
    }

    // Shipping address
    if (order.shipping_address) {
      nfeData.logradouro_destinatario = order.shipping_address;
      nfeData.numero_destinatario = order.shipping_number || "S/N";
      nfeData.bairro_destinatario = order.shipping_neighborhood || "";
      nfeData.municipio_destinatario = order.shipping_city || "";
      nfeData.uf_destinatario = order.shipping_state || "";
      nfeData.cep_destinatario = order.shipping_cep?.replace(/\D/g, "") || "";
    }

    console.log("Emitting NF-e for order:", order_id, "ref:", ref);

    // Call Focus NFe
    const focusRes = await fetch(`${FOCUS_BASE_URL}/v2/nfe?ref=${ref}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authB64}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nfeData),
    });

    const focusResult = await focusRes.json();
    console.log("Focus NFe response:", JSON.stringify(focusResult));

    const status = focusRes.ok ? "processing" : "error";
    const errorMessage = focusRes.ok ? null : (focusResult.mensagem || JSON.stringify(focusResult));

    // Save fiscal note record
    await supabaseAdmin.from("fiscal_notes").insert({
      order_id,
      type: "nfe",
      status,
      focus_ref: ref,
      customer_name: order.customer_name,
      customer_cpf: order.customer_cpf,
      customer_email: order.customer_email,
      total: order.total,
      items: items.map((i: any) => ({
        name: i.product_name,
        quantity: i.quantity,
        price: Number(i.unit_price),
      })),
      error_message: errorMessage,
      created_by: order.user_id,
    });

    return new Response(
      JSON.stringify({ success: focusRes.ok, focusResult }),
      { status: focusRes.ok ? 200 : 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Auto emit NF-e error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
