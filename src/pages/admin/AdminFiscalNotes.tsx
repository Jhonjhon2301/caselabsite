import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, Plus, RefreshCw, XCircle, Download, Eye, ChevronDown, ChevronUp,
} from "lucide-react";

interface FiscalNote {
  id: string;
  order_id: string | null;
  type: string;
  status: string;
  focus_ref: string | null;
  number: string | null;
  access_key: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  customer_name: string | null;
  customer_cpf: string | null;
  customer_email: string | null;
  total: number;
  items: any[];
  notes: string | null;
  error_message: string | null;
  created_at: string;
}

interface EmitForm {
  customerName: string;
  customerCpf: string;
  customerCnpj: string;
  customerEmail: string;
  notes: string;
  items: { name: string; quantity: number; price: number; code: string }[];
}

const emptyForm: EmitForm = {
  customerName: "",
  customerCpf: "",
  customerCnpj: "",
  customerEmail: "",
  notes: "",
  items: [{ name: "", quantity: 1, price: 0, code: "" }],
};

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-800" },
  authorized: { label: "Autorizada", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelada", color: "bg-muted text-muted-foreground" },
  error: { label: "Erro", color: "bg-red-100 text-red-800" },
};

export default function AdminFiscalNotes() {
  const [notes, setNotes] = useState<FiscalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EmitForm>({ ...emptyForm });
  const [emitting, setEmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("focus-nfe", {
        body: { action: "list" },
      });
      setNotes(data?.notes || []);
    } catch {
      toast.error("Erro ao carregar notas fiscais");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const total = form.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const addItem = () =>
    setForm({ ...form, items: [...form.items, { name: "", quantity: 1, price: 0, code: "" }] });

  const removeItem = (idx: number) =>
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const handleEmit = async () => {
    if (form.items.some((i) => !i.name.trim())) {
      toast.error("Preencha o nome de todos os itens");
      return;
    }
    if (total <= 0) {
      toast.error("O total deve ser maior que zero");
      return;
    }

    setEmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("focus-nfe", {
        body: {
          action: "emit",
          customerName: form.customerName,
          customerCpf: form.customerCpf,
          customerEmail: form.customerEmail,
          items: form.items,
          total,
          notes: form.notes,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("NF-e enviada para processamento!");
        setShowForm(false);
        setForm({ ...emptyForm, items: [{ name: "", quantity: 1, price: 0, code: "" }] });
        fetchNotes();
      } else {
        toast.error(data?.focusResult?.mensagem || "Erro ao emitir NF-e");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao emitir NF-e");
    } finally {
      setEmitting(false);
    }
  };

  const handleRefresh = async (note: FiscalNote) => {
    if (!note.focus_ref) return;
    try {
      await supabase.functions.invoke("focus-nfe", {
        body: { action: "query", noteId: note.id, focusRef: note.focus_ref },
      });
      toast.success("Status atualizado!");
      fetchNotes();
    } catch {
      toast.error("Erro ao consultar status");
    }
  };

  const handleCancel = async (note: FiscalNote) => {
    if (!note.focus_ref) return;
    if (!confirm("Tem certeza que deseja cancelar esta nota fiscal?")) return;
    try {
      const { data } = await supabase.functions.invoke("focus-nfe", {
        body: { action: "cancel", noteId: note.id, focusRef: note.focus_ref },
      });
      if (data?.success) {
        toast.success("Nota cancelada!");
        fetchNotes();
      } else {
        toast.error("Erro ao cancelar nota");
      }
    } catch {
      toast.error("Erro ao cancelar nota");
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none";

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Notas Fiscais</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Emissão e gestão de NF-e via Focus NFe (Homologação)
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Emitir NF-e
        </button>
      </div>

      {/* Emit form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
          <h2 className="font-semibold text-base mb-4">Nova Nota Fiscal Eletrônica</h2>

          {/* Customer */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Dados do Destinatário</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nome"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="CPF"
                value={form.customerCpf}
                onChange={(e) => setForm({ ...form, customerCpf: e.target.value })}
                className={inputClass}
              />
              <input
                type="email"
                placeholder="Email (opcional)"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                className={`${inputClass} sm:col-span-2`}
              />
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Itens</h3>
              <button onClick={addItem} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-2 sm:flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Produto"
                    value={item.name}
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    className={`${inputClass} col-span-2 sm:flex-1`}
                  />
                  <input
                    type="text"
                    placeholder="Código"
                    value={item.code}
                    onChange={(e) => updateItem(idx, "code", e.target.value)}
                    className={`${inputClass} sm:w-24`}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qtd"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)}
                    className={`${inputClass} sm:w-20 text-center`}
                  />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.price || ""}
                      onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                      className={`${inputClass} pl-8 sm:w-28`}
                    />
                  </div>
                  {form.items.length > 1 && (
                    <button
                      onClick={() => removeItem(idx)}
                      className="p-2 hover:bg-destructive/10 rounded-lg text-destructive col-span-2 sm:col-span-1 flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end mb-4">
            <div className="bg-foreground text-background rounded-xl px-5 py-3">
              <span className="text-sm">TOTAL: </span>
              <span className="font-heading font-black text-xl">{fmt(total)}</span>
            </div>
          </div>

          {/* Notes */}
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Observações (opcional)"
            rows={2}
            className={`${inputClass} resize-none mb-4`}
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleEmit}
              disabled={emitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              {emitting ? "Emitindo..." : "Emitir NF-e"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setForm({ ...emptyForm, items: [{ name: "", quantity: 1, price: 0, code: "" }] });
              }}
              className="px-5 py-2.5 rounded-lg border border-input text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma nota fiscal emitida</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const st = statusMap[note.status] || statusMap.pending;
            const expanded = expandedId === note.id;
            return (
              <div key={note.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expanded ? null : note.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>
                        {st.label}
                      </span>
                      {note.number && (
                        <span className="text-xs font-mono text-muted-foreground">
                          Nº {note.number}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold truncate">
                      {note.customer_name || "Consumidor Final"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(note.created_at).toLocaleDateString("pt-BR")} · {fmt(note.total)}
                    </p>
                  </div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    {note.error_message && (
                      <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg">
                        <strong>Erro:</strong> {note.error_message}
                      </div>
                    )}

                    {note.access_key && (
                      <div className="text-xs">
                        <strong>Chave de Acesso:</strong>
                        <p className="font-mono text-[10px] break-all text-muted-foreground mt-0.5">
                          {note.access_key}
                        </p>
                      </div>
                    )}

                    {note.focus_ref && (
                      <p className="text-xs text-muted-foreground">
                        <strong>Ref:</strong> {note.focus_ref}
                      </p>
                    )}

                    {/* Items */}
                    {Array.isArray(note.items) && note.items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Itens:</p>
                        <div className="space-y-1">
                          {note.items.map((item: any, idx: number) => (
                            <p key={idx} className="text-xs text-muted-foreground">
                              {item.quantity}x {item.name} — {fmt(item.price * item.quantity)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(note.status === "processing" || note.status === "pending") && (
                        <button
                          onClick={() => handleRefresh(note)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-input hover:bg-accent transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Atualizar Status
                        </button>
                      )}
                      {note.status === "authorized" && (
                        <>
                          {note.pdf_url && (
                            <a
                              href={note.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-input hover:bg-accent transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver DANFE
                            </a>
                          )}
                          {note.xml_url && (
                            <a
                              href={note.xml_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-input hover:bg-accent transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> XML
                            </a>
                          )}
                          <button
                            onClick={() => handleCancel(note)}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancelar NF-e
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
