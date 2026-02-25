import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Plus, Trash2, Printer, Eye, ArrowLeft } from "lucide-react";

interface DocItem {
  name: string;
  quantity: number;
  price: number;
}

interface DocForm {
  type: "quote" | "invoice";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf: string;
  notes: string;
  items: DocItem[];
  validity: string;
}

const emptyForm: DocForm = {
  type: "quote",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerCpf: "",
  notes: "",
  items: [{ name: "", quantity: 1, price: 0 }],
  validity: "15",
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

export default function AdminDocuments() {
  const [form, setForm] = useState<DocForm>({ ...emptyForm });
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const total = form.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const addItem = () => setForm({ ...form, items: [...form.items, { name: "", quantity: 1, price: 0 }] });
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItem = (idx: number, field: keyof DocItem, value: string | number) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const generatePreview = () => {
    if (form.items.some((i) => !i.name.trim())) {
      toast.error("Preencha o nome de todos os itens");
      return;
    }
    if (total <= 0) {
      toast.error("O total deve ser maior que zero");
      return;
    }

    const docNumber = `${form.type === "quote" ? "ORC" : "NF"}-${Date.now().toString(36).toUpperCase()}`;
    const title = form.type === "quote" ? "ORÇAMENTO" : "NOTA FISCAL";

    const itemsRows = form.items
      .map(
        (i) => `<tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;" contenteditable="true">${escapeHtml(i.name)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;" contenteditable="true">${i.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;" contenteditable="true">${fmt(i.price)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">${fmt(i.price * i.quantity)}</td>
        </tr>`
      )
      .join("");

    const customerHtml = form.customerName
      ? `<div style="margin-bottom:24px;padding:16px;background:#f8f9fa;border-radius:8px;">
          <h3 style="margin:0 0 8px;font-size:14px;color:#666;">DADOS DO CLIENTE</h3>
          <p style="margin:2px 0;font-size:14px;" contenteditable="true"><strong>${escapeHtml(form.customerName)}</strong></p>
          ${form.customerEmail ? `<p style="margin:2px 0;font-size:13px;color:#555;" contenteditable="true">${escapeHtml(form.customerEmail)}</p>` : ""}
          ${form.customerPhone ? `<p style="margin:2px 0;font-size:13px;color:#555;" contenteditable="true">${escapeHtml(form.customerPhone)}</p>` : ""}
          ${form.customerCpf ? `<p style="margin:2px 0;font-size:13px;color:#555;" contenteditable="true">CPF: ${escapeHtml(form.customerCpf)}</p>` : ""}
        </div>`
      : "";

    const notesHtml = form.notes
      ? `<div style="margin-top:24px;padding:16px;border:1px solid #ddd;border-radius:8px;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#666;">Observações:</p>
          <p style="margin:0;font-size:13px;color:#555;white-space:pre-wrap;" contenteditable="true">${escapeHtml(form.notes)}</p>
        </div>`
      : "";

    const validityText = form.type === "quote" ? `<p style="margin:4px 0 0;font-size:13px;color:#888;">Válido por ${form.validity} dias</p>` : "";

    const logoUrl = new URL("/logo.jpeg", window.location.origin).href;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body{font-family:'Helvetica','Arial',sans-serif;margin:0;padding:40px;color:#222;font-size:14px;}
  table{width:100%;border-collapse:collapse;}
  th{text-align:left;padding:10px 12px;background:#1a1a2e;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;}
  th:nth-child(2),th:nth-child(3),th:nth-child(4){text-align:right;}
  th:nth-child(2){text-align:center;}
  [contenteditable]:hover{outline:2px dashed #ccc;outline-offset:2px;border-radius:4px;}
  [contenteditable]:focus{outline:2px solid #e67e22;outline-offset:2px;border-radius:4px;background:#fffdf5;}
  @media print{[contenteditable]:hover,[contenteditable]:focus{outline:none;background:none;}}
</style></head><body>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;border-bottom:3px solid #1a1a2e;padding-bottom:20px;">
    <div style="display:flex;align-items:center;gap:16px;">
      <img src="${logoUrl}" alt="Case Lab" style="width:60px;height:60px;border-radius:50%;object-fit:cover;" />
      <div>
        <h1 style="margin:0;font-size:28px;color:#1a1a2e;" contenteditable="true">${title}</h1>
        <p style="margin:4px 0 0;color:#888;font-size:13px;">Case Lab - Garrafas Personalizadas</p>
        <p style="margin:2px 0 0;color:#aaa;font-size:11px;">CNPJ: 64.964.419/0001-46</p>
      </div>
    </div>
    <div style="text-align:right;">
      <p style="margin:0;font-size:13px;color:#888;">Nº ${docNumber}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#888;">Data: ${today()}</p>
      ${validityText}
    </div>
  </div>
  ${customerHtml}
  <table>
    <thead><tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>
  <div style="margin-top:16px;text-align:right;padding:16px;background:#1a1a2e;color:#fff;border-radius:8px;">
    <span style="font-size:14px;">TOTAL:</span>
    <span style="font-size:22px;font-weight:bold;margin-left:12px;">${fmt(total)}</span>
  </div>
  ${notesHtml}
  <div style="margin-top:40px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee;padding-top:16px;">
    <p contenteditable="true">Este documento serve como ${form.type === "quote" ? "proposta comercial" : "comprovante de venda"}.</p>
    <p style="margin:4px 0;"><strong>Case Lab - Garrafas Personalizadas</strong></p>
    <p style="margin:2px 0;">📞 (61) 99262-9861 · ✉ personalized.caselab@gmail.com</p>
    <p style="margin:2px 0;">📸 @caselaboficial_ · CNPJ: 64.964.419/0001-46</p>
  </div>
</body></html>`;

    setPreviewHtml(html);
  };

  const printDocument = () => {
    const iframe = previewRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.print();
  };

  const openInNewTab = () => {
    if (!previewHtml) return;
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Pop-up bloqueado. Permita pop-ups para esta página.");
      return;
    }
    win.document.write(previewHtml);
    win.document.close();
    win.document.title = form.type === "quote" ? "Orçamento - Case Lab" : "Nota Fiscal - Case Lab";
  };

  if (previewHtml) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setPreviewHtml(null)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao formulário
          </button>
          <div className="flex gap-2">
            <button onClick={openInNewTab} className="btn-outline text-sm py-2">
              <Eye className="w-4 h-4" /> Abrir em nova aba
            </button>
            <button onClick={printDocument} className="btn-primary text-sm py-2">
              <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">💡 Clique em qualquer texto no documento abaixo para editar antes de imprimir.</p>
        <div className="border border-border rounded-xl overflow-hidden shadow-lg bg-background">
          <iframe
            ref={previewRef}
            srcDoc={previewHtml}
            className="w-full min-h-[700px]"
            title="Pré-visualização do documento"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">Notas e Orçamentos</h1>
        <p className="text-sm text-muted-foreground">Crie documentos para vendas externas e orçamentos</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        {/* Document type */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Tipo de Documento</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "quote" })}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                form.type === "quote" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <FileText className="w-4 h-4" /> Orçamento
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, type: "invoice" })}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                form.type === "invoice" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground"
              }`}
            >
              <FileText className="w-4 h-4" /> Nota / Recibo
            </button>
          </div>
        </div>

        {/* Customer */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Dados do Cliente (opcional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Nome do cliente" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" />
            <input type="email" placeholder="Email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} className="px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" />
            <input type="text" placeholder="Telefone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" />
            <input type="text" placeholder="CPF" value={form.customerCpf} onChange={(e) => setForm({ ...form, customerCpf: e.target.value })} className="px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" />
          </div>
        </div>

        {/* Items */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Itens</h3>
            <button onClick={addItem} type="button" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Adicionar item
            </button>
          </div>
          <div className="space-y-3">
            {form.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Nome do produto/serviço"
                  value={item.name}
                  onChange={(e) => updateItem(idx, "name", e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-3 rounded-lg border border-input bg-background text-sm text-center focus:ring-2 focus:ring-ring outline-none"
                  placeholder="Qtd"
                />
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.price || ""}
                    onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                    placeholder="0.00"
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-24 text-right">{fmt(item.price * item.quantity)}</span>
                {form.items.length > 1 && (
                  <button onClick={() => removeItem(idx)} type="button" className="p-2 hover:bg-destructive/10 rounded-lg text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-end mb-6">
          <div className="bg-foreground text-background rounded-xl px-6 py-4">
            <span className="text-sm">TOTAL: </span>
            <span className="font-heading font-black text-2xl">{fmt(total)}</span>
          </div>
        </div>

        {/* Notes & Validity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">Observações</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Condições, prazo de entrega, forma de pagamento..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none resize-none"
            />
          </div>
          {form.type === "quote" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Validade do orçamento (dias)</label>
              <input
                type="number"
                min="1"
                value={form.validity}
                onChange={(e) => setForm({ ...form, validity: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={generatePreview} className="btn-primary">
            <Eye className="w-4 h-4" /> Gerar Documento
          </button>
          <button onClick={() => setForm({ ...emptyForm, items: [{ name: "", quantity: 1, price: 0 }] })} type="button" className="btn-outline">
            Limpar
          </button>
        </div>
      </div>
    </div>
  );
}
