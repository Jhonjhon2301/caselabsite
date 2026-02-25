import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function today() {
  return new Date().toLocaleDateString("pt-BR");
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateQuoteHtml(data: {
  items: { name: string; quantity: number; price: number }[];
  customer?: { name?: string; email?: string; phone?: string; cpf?: string };
  total: number;
  quoteNumber: string;
}) {
  const itemsRows = data.items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(i.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${fmt(i.price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${fmt(i.price * i.quantity)}</td>
    </tr>`
    )
    .join("");

  const customerSection = data.customer?.name
    ? `<div style="margin-bottom:24px;padding:16px;background:#f8f9fa;border-radius:8px;">
        <h3 style="margin:0 0 8px;font-size:14px;color:#666;">DADOS DO CLIENTE</h3>
        <p style="margin:2px 0;font-size:14px;"><strong>${escapeHtml(data.customer.name)}</strong></p>
        ${data.customer.email ? `<p style="margin:2px 0;font-size:13px;color:#555;">${escapeHtml(data.customer.email)}</p>` : ""}
        ${data.customer.phone ? `<p style="margin:2px 0;font-size:13px;color:#555;">${escapeHtml(data.customer.phone)}</p>` : ""}
        ${data.customer.cpf ? `<p style="margin:2px 0;font-size:13px;color:#555;">CPF: ${escapeHtml(data.customer.cpf)}</p>` : ""}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:'Helvetica','Arial',sans-serif;margin:0;padding:40px;color:#222;font-size:14px;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;padding:10px 12px;background:#1a1a2e;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;}
  th:nth-child(2),th:nth-child(3),th:nth-child(4){text-align:right;}
  th:nth-child(2){text-align:center;}
</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;border-bottom:3px solid #1a1a2e;padding-bottom:20px;">
    <div>
      <h1 style="margin:0;font-size:28px;color:#1a1a2e;">ORÇAMENTO</h1>
      <p style="margin:4px 0 0;color:#888;font-size:13px;">Case Lab - Garrafas Personalizadas</p>
      <p style="margin:2px 0 0;color:#aaa;font-size:11px;">CNPJ: 64.964.419/0001-46</p>
    </div>
    <div style="text-align:right;">
      <p style="margin:0;font-size:13px;color:#888;">Nº ${escapeHtml(data.quoteNumber)}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">Data: ${today()}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">Válido por 15 dias</p>
    </div>
  </div>
  ${customerSection}
  <table>
    <thead><tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>
  <div style="margin-top:16px;text-align:right;padding:16px;background:#1a1a2e;color:#fff;border-radius:8px;">
    <span style="font-size:14px;">TOTAL:</span>
    <span style="font-size:22px;font-weight:bold;margin-left:12px;">${fmt(data.total)}</span>
  </div>
  <div style="margin-top:32px;padding:16px;border:1px solid #ddd;border-radius:8px;font-size:12px;color:#666;">
    <p style="margin:0 0 4px;"><strong>Observações:</strong></p>
    <p style="margin:0;">• Este orçamento é válido por 15 dias a partir da data de emissão.</p>
    <p style="margin:0;">• Produtos personalizados não possuem troca ou devolução.</p>
    <p style="margin:0;">• O prazo de produção é de 3 a 7 dias úteis após a confirmação do pagamento.</p>
  </div>
  <div style="margin-top:24px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:12px;">
    <p style="margin:2px 0;"><strong>Case Lab - Garrafas Personalizadas</strong></p>
    <p style="margin:2px 0;">📞 (61) 99262-9861 · ✉ personalized.caselab@gmail.com</p>
    <p style="margin:2px 0;">📸 @caselaboficial_ · CNPJ: 64.964.419/0001-46</p>
  </div>
</body></html>`;
}

function generateReceiptHtml(data: {
  order: any;
  items: { product_name: string; quantity: number; unit_price: number }[];
}) {
  const o = data.order;
  const itemsRows = data.items
    .map(
      (i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;">${escapeHtml(i.product_name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${fmt(Number(i.unit_price))}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${fmt(Number(i.unit_price) * i.quantity)}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:'Helvetica','Arial',sans-serif;margin:0;padding:40px;color:#222;font-size:14px;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;padding:10px 12px;background:#1a1a2e;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;}
  th:nth-child(2),th:nth-child(3),th:nth-child(4){text-align:right;}
  th:nth-child(2){text-align:center;}
</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;border-bottom:3px solid #1a1a2e;padding-bottom:20px;">
    <div>
      <h1 style="margin:0;font-size:28px;color:#1a1a2e;">RECIBO</h1>
      <p style="margin:4px 0 0;color:#888;font-size:13px;">Case Lab - Garrafas Personalizadas</p>
      <p style="margin:2px 0 0;color:#aaa;font-size:11px;">CNPJ: 64.964.419/0001-46</p>
    </div>
    <div style="text-align:right;">
      <p style="margin:0;font-size:13px;color:#888;">Pedido #${escapeHtml(o.id.slice(0, 8))}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">Data: ${new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
    </div>
  </div>
  <div style="margin-bottom:24px;padding:16px;background:#f8f9fa;border-radius:8px;">
    <h3 style="margin:0 0 8px;font-size:14px;color:#666;">DADOS DO CLIENTE</h3>
    <p style="margin:2px 0;font-size:14px;"><strong>${escapeHtml(o.customer_name || "—")}</strong></p>
    ${o.customer_email ? `<p style="margin:2px 0;font-size:13px;color:#555;">${escapeHtml(o.customer_email)}</p>` : ""}
    ${o.customer_phone ? `<p style="margin:2px 0;font-size:13px;color:#555;">${escapeHtml(o.customer_phone)}</p>` : ""}
    ${o.customer_cpf ? `<p style="margin:2px 0;font-size:13px;color:#555;">CPF: ${escapeHtml(o.customer_cpf)}</p>` : ""}
  </div>
  ${o.shipping_address ? `<div style="margin-bottom:24px;padding:16px;background:#f8f9fa;border-radius:8px;">
    <h3 style="margin:0 0 8px;font-size:14px;color:#666;">ENDEREÇO DE ENTREGA</h3>
    <p style="margin:2px 0;font-size:13px;">${escapeHtml(o.shipping_address)}, ${escapeHtml(o.shipping_number || "")}</p>
    ${o.shipping_complement ? `<p style="margin:2px 0;font-size:13px;">${escapeHtml(o.shipping_complement)}</p>` : ""}
    <p style="margin:2px 0;font-size:13px;">${escapeHtml(o.shipping_neighborhood || "")} - ${escapeHtml(o.shipping_city || "")}/${escapeHtml(o.shipping_state || "")}</p>
    <p style="margin:2px 0;font-size:13px;">CEP: ${escapeHtml(o.shipping_cep || "")}</p>
  </div>` : ""}
  <table>
    <thead><tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>
  <div style="margin-top:16px;text-align:right;">
    <p style="margin:4px 0;font-size:14px;">Subtotal: ${fmt(Number(o.subtotal))}</p>
    ${Number(o.discount) > 0 ? `<p style="margin:4px 0;font-size:14px;color:#16a34a;">Desconto: -${fmt(Number(o.discount))}</p>` : ""}
    <div style="margin-top:8px;padding:16px;background:#1a1a2e;color:#fff;border-radius:8px;display:inline-block;">
      <span style="font-size:14px;">TOTAL PAGO:</span>
      <span style="font-size:22px;font-weight:bold;margin-left:12px;">${fmt(Number(o.total))}</span>
    </div>
  </div>
  <div style="margin-top:40px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:12px;">
    <p>Este documento serve como comprovante de compra.</p>
    <p style="margin:2px 0;"><strong>Case Lab - Garrafas Personalizadas</strong></p>
    <p style="margin:2px 0;">📞 (61) 99262-9861 · ✉ personalized.caselab@gmail.com</p>
    <p style="margin:2px 0;">📸 @caselaboficial_ · CNPJ: 64.964.419/0001-46</p>
  </div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, items, customer, orderId } = await req.json();

    if (type === "quote") {
      // Generate quote from cart items (no auth required)
      if (!items?.length) throw new Error("Nenhum item fornecido");

      const total = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
      const quoteNumber = `ORC-${Date.now().toString(36).toUpperCase()}`;

      const html = generateQuoteHtml({ items, customer, total, quoteNumber });

      return new Response(JSON.stringify({ html, quoteNumber }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "receipt") {
      // Generate receipt from an existing order (requires order data)
      if (!orderId) throw new Error("ID do pedido não fornecido");

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderErr || !order) throw new Error("Pedido não encontrado");

      const { data: orderItems } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      const html = generateReceiptHtml({ order, items: orderItems || [] });

      return new Response(JSON.stringify({ html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Tipo inválido. Use 'quote' ou 'receipt'.");
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
