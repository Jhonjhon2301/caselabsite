import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STATUS_INFO: Record<string, { subject: string; emoji: string; heading: string; message: string }> = {
  confirmed: {
    subject: "✅ Pedido Confirmado — Case Lab",
    emoji: "✅",
    heading: "Pedido Confirmado!",
    message: "Seu pedido foi confirmado e está sendo preparado. Em breve iniciaremos a produção da sua garrafa personalizada.",
  },
  processing: {
    subject: "🎨 Pedido em Produção — Case Lab",
    emoji: "🎨",
    heading: "Em Produção!",
    message: "Seu pedido está sendo produzido com todo cuidado e carinho! Logo ficará pronto para envio.",
  },
  shipped: {
    subject: "📦 Pedido Enviado — Case Lab",
    emoji: "📦",
    heading: "Pedido Enviado!",
    message: "Seu pedido foi enviado e está a caminho! Fique de olho na entrega.",
  },
  delivered: {
    subject: "🎉 Pedido Entregue — Case Lab",
    emoji: "🎉",
    heading: "Pedido Entregue!",
    message: "Seu pedido foi entregue! Esperamos que você ame sua garrafa personalizada. Nos conte o que achou!",
  },
};

function buildEmailHtml(
  customerName: string,
  statusInfo: { emoji: string; heading: string; message: string },
  orderId: string,
  items: { product_name: string; quantity: number; unit_price: number }[],
  total: number,
  trackingCode?: string,
  trackingUrl?: string
) {
  const itemsHtml = items
    .map(
      (i) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee">${i.quantity}x ${i.product_name}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">R$ ${Number(i.unit_price).toFixed(2)}</td></tr>`
    )
    .join("");

  const trackingHtml =
    trackingCode
      ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin:16px 0">
           <strong>🚚 Código de rastreio:</strong> ${trackingCode}
           ${trackingUrl ? `<br><a href="${trackingUrl}" style="color:#16a34a">Rastrear pedido →</a>` : ""}
         </div>`
      : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#18181b;padding:20px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Case Lab</h1>
    <p style="color:#a1a1aa;margin:4px 0 0;font-size:13px">Garrafas Personalizadas</p>
  </div>
  <div style="background:#fff;padding:28px 24px;border-radius:0 0 12px 12px">
    <div style="text-align:center;margin-bottom:20px">
      <span style="font-size:40px">${statusInfo.emoji}</span>
      <h2 style="margin:8px 0 4px;color:#18181b">${statusInfo.heading}</h2>
    </div>
    <p style="color:#3f3f46">Olá, <strong>${customerName}</strong>!</p>
    <p style="color:#52525b">${statusInfo.message}</p>
    <div style="background:#fafafa;border-radius:8px;padding:12px 0;margin:16px 0">
      <p style="margin:0 12px 8px;font-size:13px;color:#71717a"><strong>Pedido:</strong> #${orderId.slice(0, 8).toUpperCase()}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${itemsHtml}
        <tr><td style="padding:10px 12px;font-weight:bold">Total</td><td style="padding:10px 12px;text-align:right;font-weight:bold;color:#16a34a">R$ ${Number(total).toFixed(2)}</td></tr>
      </table>
    </div>
    ${trackingHtml}
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0">
    <p style="font-size:12px;color:#a1a1aa;text-align:center">Dúvidas? Responda este e-mail ou nos chame no WhatsApp.<br>Case Lab — Garrafas Personalizadas</p>
  </div>
</div>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { order_id, status } = await req.json();
    if (!order_id || !status) throw new Error("order_id e status são obrigatórios");

    const statusInfo = STATUS_INFO[status];
    if (!statusInfo) {
      return new Response(JSON.stringify({ message: "Sem template para este status" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) throw new Error("Pedido não encontrado");
    if (!order.customer_email) throw new Error("Cliente sem e-mail cadastrado");

    const html = buildEmailHtml(
      order.customer_name || "Cliente",
      statusInfo,
      order_id,
      order.order_items || [],
      order.total,
      order.tracking_code,
      order.tracking_url
    );

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Case Lab <no-reply@caselab.site>",
        to: [order.customer_email],
        subject: statusInfo.subject,
        html,
      }),
    });

    const resendResult = await resendRes.json();
    console.log("Resend response:", JSON.stringify(resendResult));

    return new Response(
      JSON.stringify({ success: resendRes.ok, resendResult }),
      { status: resendRes.ok ? 200 : 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Send order email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
