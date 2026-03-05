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

function generateProposalHtml(data: { title: string; recipient: string; content: string; logoUrl: string }) {
  const lines = data.content.split("\n").filter(l => l.trim());
  let bodyHtml = "";
  let inBulletList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    const isBullet = /^[•\-–]\s/.test(trimmed);

    if (!isBullet && inBulletList) {
      bodyHtml += `</ul>`;
      inBulletList = false;
    }

    // Numbered section headers
    if (/^\d+\.\s/.test(trimmed)) {
      bodyHtml += `<div style="margin:32px 0 14px;border-left:4px solid #1a1a2e;padding-left:14px;">
        <h2 style="margin:0;font-size:15px;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(trimmed)}</h2>
      </div>`;
    }
    // Dividers
    else if (/^[⸻\-=]{3,}/.test(trimmed)) {
      // skip
    }
    // Bullet points
    else if (isBullet) {
      if (!inBulletList) {
        bodyHtml += `<ul style="margin:8px 0;padding-left:24px;list-style:none;">`;
        inBulletList = true;
      }
      bodyHtml += `<li style="margin:5px 0;font-size:13px;line-height:1.8;color:#333;position:relative;padding-left:16px;">
        <span style="position:absolute;left:0;color:#1a1a2e;font-weight:bold;">•</span>
        ${escapeHtml(trimmed.replace(/^[•\-–]\s*/, ""))}
      </li>`;
    }
    // All-caps headings
    else if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && trimmed.length < 80 && !/^\d/.test(trimmed)) {
      bodyHtml += `<h3 style="margin:22px 0 10px;font-size:13px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:1px;">${escapeHtml(trimmed)}</h3>`;
    }
    // Highlighted value lines (R$, percentages, key info)
    else if (/^(Ou seja|Valor|Percentual|O repasse):/.test(trimmed) || /^R\$/.test(trimmed)) {
      bodyHtml += `<div style="margin:8px 0;padding:10px 16px;background:#f0f4ff;border-left:3px solid #1a1a2e;border-radius:0 6px 6px 0;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#1a1a2e;">${escapeHtml(trimmed)}</p>
      </div>`;
    }
    // Regular paragraph
    else {
      bodyHtml += `<p style="margin:6px 0;font-size:13px;line-height:1.8;color:#444;">${escapeHtml(trimmed)}</p>`;
    }
  }

  if (inBulletList) bodyHtml += `</ul>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  @page { margin: 20mm; }
  body { font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 0; color: #222; font-size: 14px; background: #fff; }
  .page { max-width: 720px; margin: 0 auto; padding: 40px; }
  @media print { .page { padding: 0; max-width: none; } }
</style></head><body>
<div class="page">

  <!-- HEADER -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
    <tr>
      <td style="width:80px;vertical-align:middle;padding-right:16px;">
        <img src="${data.logoUrl}" alt="Case Lab" style="width:70px;height:70px;border-radius:12px;object-fit:cover;" />
      </td>
      <td style="vertical-align:middle;">
        <p style="margin:0;font-size:18px;font-weight:800;color:#1a1a2e;letter-spacing:0.5px;">CASE LAB</p>
        <p style="margin:2px 0 0;font-size:11px;color:#888;letter-spacing:0.3px;">Garrafas Personalizadas</p>
        <p style="margin:1px 0 0;font-size:10px;color:#aaa;">CNPJ: 64.964.419/0001-46</p>
      </td>
      <td style="vertical-align:middle;text-align:right;">
        <p style="margin:0;font-size:11px;color:#999;">Data de emissão</p>
        <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#1a1a2e;">${today()}</p>
      </td>
    </tr>
  </table>

  <div style="height:3px;background:linear-gradient(90deg,#1a1a2e 0%,#3b3b6b 50%,#1a1a2e 100%);margin:16px 0 28px;border-radius:2px;"></div>

  <!-- TITLE -->
  <div style="text-align:center;margin-bottom:28px;">
    <h1 style="margin:0;font-size:22px;color:#1a1a2e;letter-spacing:2px;font-weight:800;">${escapeHtml(data.title)}</h1>
    ${data.recipient ? `<div style="margin-top:12px;display:inline-block;padding:6px 20px;background:#f0f4ff;border-radius:20px;font-size:12px;color:#1a1a2e;">
      Destinatário: <strong>${escapeHtml(data.recipient)}</strong>
    </div>` : ""}
  </div>

  <!-- BODY -->
  <div style="margin-bottom:32px;">
    ${bodyHtml}
  </div>

  <!-- SIGNATURE -->
  <div style="margin-top:48px;border-top:2px solid #eee;padding-top:24px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="vertical-align:top;width:50%;">
          <p style="margin:0 0 6px;font-size:13px;color:#888;">Atenciosamente,</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#1a1a2e;">Case Lab</p>
          <p style="margin:6px 0 2px;font-size:12px;color:#555;">📞 (61) 99262-9861</p>
          <p style="margin:2px 0;font-size:12px;color:#555;">✉ personalized.caselab@gmail.com</p>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <p style="margin:0 0 6px;font-size:13px;color:#888;">Redes sociais</p>
          <p style="margin:0;font-size:12px;color:#555;">📸 @caselaboficial_</p>
          <div style="margin-top:12px;padding:8px 14px;background:#1a1a2e;color:#fff;border-radius:6px;display:inline-block;font-size:11px;">
            caselaboficial.com.br
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- FOOTER -->
  <div style="margin-top:24px;text-align:center;font-size:10px;color:#bbb;border-top:1px solid #eee;padding-top:12px;">
    <p style="margin:0;">Este documento foi gerado eletronicamente pela Case Lab e não requer assinatura.</p>
  </div>

</div>
</body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, items, customer, orderId, title, recipient, content } = body;

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

    if (type === "proposal") {
      if (!content) throw new Error("Conteúdo da proposta não fornecido");
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
      const logoStorageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/logo.jpeg`;
      let logoUrl = logoStorageUrl;
      try {
        const logoRes = await fetch(logoStorageUrl);
        if (logoRes.ok) {
          const buf = await logoRes.arrayBuffer();
          const bytes = new Uint8Array(buf);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          const b64 = btoa(binary);
          logoUrl = `data:image/jpeg;base64,${b64}`;
        }
      } catch { /* fallback to URL */ }
      const html = generateProposalHtml({ title: title || "PROPOSTA", recipient: recipient || "", content, logoUrl });
      return new Response(JSON.stringify({ html }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Tipo inválido. Use 'quote', 'receipt' ou 'proposal'.");
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
