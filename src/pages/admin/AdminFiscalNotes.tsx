import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText, Plus, RefreshCw, XCircle, Download, Eye, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ───
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

const UF_OPTIONS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO","EX",
];

const FORMA_PAGAMENTO_OPTIONS = [
  { value: "01", label: "01 - Dinheiro" },
  { value: "02", label: "02 - Cheque" },
  { value: "03", label: "03 - Cartão de Crédito" },
  { value: "04", label: "04 - Cartão de Débito" },
  { value: "05", label: "05 - Crédito Loja" },
  { value: "10", label: "10 - Vale Alimentação" },
  { value: "11", label: "11 - Vale Refeição" },
  { value: "12", label: "12 - Vale Presente" },
  { value: "14", label: "14 - Duplicata Mercantil" },
  { value: "15", label: "15 - Boleto Bancário" },
  { value: "16", label: "16 - Depósito Bancário" },
  { value: "17", label: "17 - PIX (Dinâmico)" },
  { value: "18", label: "18 - Transferência Bancária" },
  { value: "20", label: "20 - PIX (Estático)" },
  { value: "90", label: "90 - Sem pagamento" },
  { value: "99", label: "99 - Outros" },
];

const INDICADOR_PRESENCA_OPTIONS = [
  { value: 0, label: "0 - Não se aplica" },
  { value: 1, label: "1 - Operação presencial" },
  { value: 2, label: "2 - Não presencial, Internet" },
  { value: 3, label: "3 - Não presencial, Teleatendimento" },
  { value: 4, label: "4 - NFC-e com entrega a domicílio" },
  { value: 5, label: "5 - Presencial fora do estabelecimento" },
  { value: 9, label: "9 - Não presencial, outros" },
];

const MODALIDADE_FRETE_OPTIONS = [
  { value: 0, label: "0 - CIF (Remetente)" },
  { value: 1, label: "1 - FOB (Destinatário)" },
  { value: 2, label: "2 - Terceiros" },
  { value: 3, label: "3 - Próprio (Remetente)" },
  { value: 4, label: "4 - Próprio (Destinatário)" },
  { value: 9, label: "9 - Sem Transporte" },
];

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-800" },
  authorized: { label: "Autorizada", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelada", color: "bg-muted text-muted-foreground" },
  error: { label: "Erro", color: "bg-red-100 text-red-800" },
};

function fmt(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none";
const sectionTitle = "text-sm font-bold text-primary flex items-center gap-2 mb-3";

// ─── Default form ───
const defaultForm = () => ({
  // Tipo / Natureza / Finalidade
  modeloDocumento: 55,
  naturezaOperacao: "Venda de mercadoria",
  finalidade: 1,
  tipoAmbiente: "1",
  // Destinatário
  consumidorFinal: true,
  cpfCnpj: "",
  nomeCliente: "",
  indicadorIe: 9,
  inscricaoEstadual: "",
  // Endereço
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  municipio: "",
  uf: "",
  complemento: "",
  codMunicipio: "",
  // Contato
  telefone: "",
  email: "",
  // Produtos
  items: [{ code: "", name: "", quantity: 1, price: 0, discount: 0, ncm: "00000000", cfop: 5102, unidade: "UND", origem: 0, cstIcms: "102", cstPis: "07", cstCofins: "07" }] as any[],
  // Transporte
  modalidadeFrete: 9,
  volumes: [] as any[],
  veiculo: { placa: "", uf: "", rntc: "" },
  reboques: [] as any[],
  // Configurações
  indicadorPresenca: 2,
  dataEmissao: "",
  horaEmissao: "",
  dataSaida: "",
  horaSaida: "",
  observacao: "",
  observacaoFisco: "",
  // Pagamento
  formaPagamento: "17",
  valorPago: 0,
  valorTroco: 0,
  // Cobrança / Fatura
  faturaNumero: "",
  faturaValor: 0,
  faturaDesconto: 0,
  faturaValorLiquido: 0,
  parcelas: [] as { vencimento: string; valor: number }[],
  // Referências
  nfReferencia: "",
  // Exportação
  ufSaidaPais: "",
  localDespacho: "",
  localEmbarque: "",
  // Identificador
  orderId: null as string | null,
});

type EmitForm = ReturnType<typeof defaultForm>;

// ─── Collapsible Section ───
function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors">
        <span className={sectionTitle + " mb-0"}>{icon} {title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Main Component ───
export default function AdminFiscalNotes() {
  const [notes, setNotes] = useState<FiscalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EmitForm>(defaultForm());
  const [emitting, setEmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrder, setLoadingOrder] = useState(false);

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

  useEffect(() => { fetchNotes(); }, []);

  // Load order to auto-fill
  const loadOrderData = async (orderId: string) => {
    if (!orderId) return;
    setLoadingOrder(true);
    try {
      const { data: order } = await supabase.from("orders").select("*, order_items(*, products(*))").eq("id", orderId).single();
      if (!order) { toast.error("Pedido não encontrado"); return; }

      // Load profile
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", order.user_id).single();

      const isCnpj = (order.customer_cpf?.replace(/\D/g, "")?.length || 0) > 11;
      setForm(prev => ({
        ...prev,
        orderId,
        cpfCnpj: order.customer_cpf?.replace(/\D/g, "") || "",
        nomeCliente: order.customer_name || profile?.full_name || "",
        email: order.customer_email || profile?.email || "",
        telefone: profile?.phone?.replace(/\D/g, "") || "",
        consumidorFinal: !isCnpj,
        indicadorIe: isCnpj ? 1 : 9,
        cep: order.shipping_cep || profile?.address_cep || "",
        logradouro: order.shipping_address || profile?.address_street || "",
        numero: order.shipping_number || profile?.address_number || "",
        bairro: order.shipping_neighborhood || profile?.address_neighborhood || "",
        municipio: order.shipping_city || profile?.address_city || "",
        uf: order.shipping_state || profile?.address_state || "",
        complemento: order.shipping_complement || profile?.address_complement || "",
        valorPago: Number(order.total) || 0,
        faturaValor: Number(order.total) || 0,
        faturaValorLiquido: Number(order.total) || 0,
        items: (order.order_items || []).map((oi: any, idx: number) => ({
          code: String(idx + 1).padStart(4, "0"),
          name: oi.product_name,
          quantity: oi.quantity,
          price: Number(oi.unit_price),
          discount: 0,
          ncm: oi.products?.ncm || "00000000",
          cfop: oi.products?.cfop || 5102,
          unidade: oi.products?.unidade_comercial || "UND",
          origem: oi.products?.origem_produto || 0,
          cstIcms: oi.products?.cod_situacao_tributaria_icms || "102",
          cstPis: oi.products?.cod_situacao_tributaria_pis || "07",
          cstCofins: oi.products?.cod_situacao_tributaria_cofins || "07",
        })),
      }));
      toast.success("Dados do pedido carregados!");
    } catch (e) {
      toast.error("Erro ao carregar pedido");
    } finally {
      setLoadingOrder(false);
    }
  };

  // Search orders for dropdown
  const searchOrders = async () => {
    const { data } = await supabase.from("orders").select("id, customer_name, total, created_at").order("created_at", { ascending: false }).limit(50);
    setOrders(data || []);
  };

  const total = form.items.reduce((s, i) => s + i.price * i.quantity - (i.discount || 0), 0);

  const addItem = () => setForm({ ...form, items: [...form.items, { code: "", name: "", quantity: 1, price: 0, discount: 0, ncm: "00000000", cfop: 5102, unidade: "UND", origem: 0, cstIcms: "102", cstPis: "07", cstCofins: "07" }] });
  const removeItem = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const handleEmit = async () => {
    if (form.items.some(i => !i.name.trim())) { toast.error("Preencha o nome de todos os itens"); return; }
    if (total <= 0) { toast.error("O total deve ser maior que zero"); return; }

    setEmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("focus-nfe", {
        body: { action: "emit", ...form, total },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("NF-e enviada para processamento!");
        setShowForm(false);
        setForm(defaultForm());
        fetchNotes();
      } else {
        toast.error(data?.error || "Erro ao emitir NF-e");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao emitir NF-e");
    } finally {
      setEmitting(false);
    }
  };

  const handleRefresh = async (note: FiscalNote) => {
    try {
      await supabase.functions.invoke("focus-nfe", { body: { action: "query", noteId: note.id } });
      toast.success("Status atualizado!");
      fetchNotes();
    } catch { toast.error("Erro ao consultar status"); }
  };

  const handleCancel = async (note: FiscalNote) => {
    if (!confirm("Tem certeza que deseja cancelar esta nota fiscal?")) return;
    try {
      const { data } = await supabase.functions.invoke("focus-nfe", { body: { action: "cancel", noteId: note.id } });
      if (data?.success) { toast.success("Nota cancelada!"); fetchNotes(); }
      else toast.error("Erro ao cancelar nota");
    } catch { toast.error("Erro ao cancelar nota"); }
  };

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Notas Fiscais</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Emissão e gestão de NF-e via Brasil NFe (Produção)</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (!showForm) searchOrders(); }} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Emitir NF-e
        </button>
      </div>

      {/* ─── EMISSION FORM ─── */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 space-y-4">
          {/* Top bar: Model toggle + Natureza + Finalidade */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
              <button type="button" onClick={() => setForm({ ...form, modeloDocumento: 55 })} className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${form.modeloDocumento === 55 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>NF-e</button>
              <button type="button" onClick={() => setForm({ ...form, modeloDocumento: 65 })} className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${form.modeloDocumento === 65 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>NFC-e</button>
            </div>
            <input type="text" placeholder="Natureza da operação" value={form.naturezaOperacao} onChange={e => setForm({ ...form, naturezaOperacao: e.target.value })} className={inputClass + " flex-1 min-w-[200px]"} />
            <select value={form.finalidade} onChange={e => setForm({ ...form, finalidade: Number(e.target.value) })} className={inputClass + " w-auto"}>
              <option value={1}>Normal</option>
              <option value={2}>Complementar</option>
              <option value={3}>Ajuste</option>
              <option value={4}>Devolução</option>
            </select>
          </div>

          {/* Load from order */}
          <div className="flex items-center gap-3">
            <select onChange={e => { if (e.target.value) loadOrderData(e.target.value); }} className={inputClass + " max-w-md"} disabled={loadingOrder}>
              <option value="">Vincular pedido (opcional)...</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.customer_name || "Sem nome"} — {fmt(o.total)} — {new Date(o.created_at).toLocaleDateString("pt-BR")}</option>)}
            </select>
            {loadingOrder && <span className="text-xs text-muted-foreground">Carregando...</span>}
          </div>

          {/* ─── DESTINATÁRIO ─── */}
          <Section title="Informações do Destinatário" icon="ℹ️" defaultOpen={true}>
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.consumidorFinal} onChange={e => setForm({ ...form, consumidorFinal: e.target.checked })} className="rounded" />
                Consumidor Final?
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">CNPJ/CPF</label>
                <input type="text" value={form.cpfCnpj} onChange={e => setForm({ ...form, cpfCnpj: e.target.value })} className={inputClass} placeholder="CPF ou CNPJ" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Nome</label>
                <input type="text" value={form.nomeCliente} onChange={e => setForm({ ...form, nomeCliente: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Indicador IE</label>
                <select value={form.indicadorIe} onChange={e => setForm({ ...form, indicadorIe: Number(e.target.value) })} className={inputClass}>
                  <option value={1}>1 - Contribuinte ICMS</option>
                  <option value={2}>2 - Contribuinte isento</option>
                  <option value={9}>9 - Não contribuinte</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">IE (Inscrição Estadual)</label>
                <input type="text" value={form.inscricaoEstadual} onChange={e => setForm({ ...form, inscricaoEstadual: e.target.value })} className={inputClass} placeholder="ISENTO" />
              </div>
            </div>
            {/* Endereço */}
            <h4 className="text-xs font-bold text-primary mt-4 mb-2 flex items-center gap-1">🏠 Endereço</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">CEP</label>
                <input type="text" value={form.cep} onChange={e => setForm({ ...form, cep: e.target.value })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1">Logradouro</label>
                <input type="text" value={form.logradouro} onChange={e => setForm({ ...form, logradouro: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Número</label>
                <input type="text" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Bairro</label>
                <input type="text" value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Município</label>
                <input type="text" value={form.municipio} onChange={e => setForm({ ...form, municipio: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Estado</label>
                <select value={form.uf} onChange={e => setForm({ ...form, uf: e.target.value })} className={inputClass}>
                  <option value="">Selecione</option>
                  {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Complemento</label>
                <input type="text" value={form.complemento} onChange={e => setForm({ ...form, complemento: e.target.value })} className={inputClass} />
              </div>
            </div>
            {/* Contato */}
            <h4 className="text-xs font-bold text-primary mt-4 mb-2 flex items-center gap-1">📞 Contato</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Telefone</label>
                <input type="text" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className={inputClass} placeholder="(00) 0000-0000" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
            </div>
          </Section>

          {/* ─── PRODUTOS ─── */}
          <Section title="Produtos" icon="📦" defaultOpen={true}>
            <div className="space-y-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <input type="text" placeholder="Código" value={item.code} onChange={e => updateItem(idx, "code", e.target.value)} className={inputClass} />
                    <input type="text" placeholder="Produto" value={item.name} onChange={e => updateItem(idx, "name", e.target.value)} className={inputClass + " col-span-2"} />
                    <input type="number" min={1} placeholder="Qtd" value={item.quantity} onChange={e => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className={inputClass} />
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                      <input type="number" step="0.01" min={0} value={item.price || ""} onChange={e => updateItem(idx, "price", parseFloat(e.target.value) || 0)} className={inputClass + " pl-8"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">Desc R$</span>
                      <input type="number" step="0.01" min={0} value={item.discount || ""} onChange={e => updateItem(idx, "discount", parseFloat(e.target.value) || 0)} className={inputClass + " pl-14"} />
                    </div>
                    <input type="text" placeholder="NCM" value={item.ncm} onChange={e => updateItem(idx, "ncm", e.target.value)} className={inputClass} />
                    <input type="number" placeholder="CFOP" value={item.cfop} onChange={e => updateItem(idx, "cfop", parseInt(e.target.value) || 5102)} className={inputClass} />
                    <select value={item.unidade} onChange={e => updateItem(idx, "unidade", e.target.value)} className={inputClass}>
                      <option value="UND">UND</option><option value="CX">CX</option><option value="KG">KG</option><option value="PC">PC</option><option value="PAR">PAR</option><option value="PCT">PCT</option>
                    </select>
                    <select value={item.cstIcms} onChange={e => updateItem(idx, "cstIcms", e.target.value)} className={inputClass}>
                      <option value="00">CST 00</option><option value="10">CST 10</option><option value="20">CST 20</option><option value="40">CST 40</option><option value="41">CST 41</option><option value="60">CST 60</option><option value="102">CSOSN 102</option><option value="103">CSOSN 103</option><option value="400">CSOSN 400</option><option value="500">CSOSN 500</option><option value="900">CSOSN 900</option>
                    </select>
                    {form.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive flex items-center justify-center">
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mt-2">
              <Plus className="w-3.5 h-3.5" /> Adicionar produto
            </button>
            <div className="flex justify-end mt-3">
              <div className="bg-foreground text-background rounded-xl px-5 py-3">
                <span className="text-sm">TOTAL: </span>
                <span className="font-heading font-black text-xl">{fmt(total)}</span>
              </div>
            </div>
          </Section>

          {/* ─── TRANSPORTE ─── */}
          <Section title="Informações Transporte" icon="🚚" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Modalidade do Frete</label>
                <select value={form.modalidadeFrete} onChange={e => setForm({ ...form, modalidadeFrete: Number(e.target.value) })} className={inputClass}>
                  {MODALIDADE_FRETE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <h4 className="text-xs font-bold text-primary mt-3 mb-2">Veículo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" placeholder="Placa do Veículo" value={form.veiculo.placa} onChange={e => setForm({ ...form, veiculo: { ...form.veiculo, placa: e.target.value } })} className={inputClass} />
              <select value={form.veiculo.uf} onChange={e => setForm({ ...form, veiculo: { ...form.veiculo, uf: e.target.value } })} className={inputClass}>
                <option value="">UF</option>
                {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
              <input type="text" placeholder="RNTC" value={form.veiculo.rntc} onChange={e => setForm({ ...form, veiculo: { ...form.veiculo, rntc: e.target.value } })} className={inputClass} />
            </div>
          </Section>

          {/* ─── CONFIGURAÇÕES ─── */}
          <Section title="Configurações" icon="⚙️" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Indicador de Presença</label>
                <select value={form.indicadorPresenca} onChange={e => setForm({ ...form, indicadorPresenca: Number(e.target.value) })} className={inputClass}>
                  {INDICADOR_PRESENCA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Data Emissão</label>
                <input type="date" value={form.dataEmissao} onChange={e => setForm({ ...form, dataEmissao: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Hora Emissão</label>
                <input type="time" value={form.horaEmissao} onChange={e => setForm({ ...form, horaEmissao: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Data Saída</label>
                <input type="date" value={form.dataSaida} onChange={e => setForm({ ...form, dataSaida: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Hora Saída</label>
                <input type="time" value={form.horaSaida} onChange={e => setForm({ ...form, horaSaida: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium mb-1">Observação</label>
                <textarea value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} className={inputClass + " resize-none min-h-[60px]"} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Observação Fisco</label>
                <textarea value={form.observacaoFisco} onChange={e => setForm({ ...form, observacaoFisco: e.target.value })} className={inputClass + " resize-none min-h-[60px]"} />
              </div>
            </div>
          </Section>

          {/* ─── FORMA DE PAGAMENTO ─── */}
          <Section title="Forma de Pagamento" icon="💳" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Forma de Pagamento</label>
                <select value={form.formaPagamento} onChange={e => setForm({ ...form, formaPagamento: e.target.value })} className={inputClass}>
                  {FORMA_PAGAMENTO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Valor Pago R$</label>
                <input type="number" step="0.01" min={0} value={form.valorPago || ""} onChange={e => setForm({ ...form, valorPago: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Valor Troco R$</label>
                <input type="number" step="0.01" min={0} value={form.valorTroco || ""} onChange={e => setForm({ ...form, valorTroco: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
            </div>
          </Section>

          {/* ─── FINANCEIRO / COBRANÇA ─── */}
          <Section title="Financeiro" icon="📋" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Número da Fatura</label>
                <input type="text" value={form.faturaNumero} onChange={e => setForm({ ...form, faturaNumero: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Valor Original R$</label>
                <input type="number" step="0.01" value={form.faturaValor || ""} onChange={e => setForm({ ...form, faturaValor: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Desconto R$</label>
                <input type="number" step="0.01" value={form.faturaDesconto || ""} onChange={e => setForm({ ...form, faturaDesconto: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Valor Líquido R$</label>
                <input type="number" step="0.01" value={form.faturaValorLiquido || ""} onChange={e => setForm({ ...form, faturaValorLiquido: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
            </div>
            <h4 className="text-xs font-bold text-primary mt-3 mb-2">Parcelas</h4>
            {form.parcelas.map((p, idx) => (
              <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                <input type="date" value={p.vencimento} onChange={e => { const parcelas = [...form.parcelas]; parcelas[idx] = { ...parcelas[idx], vencimento: e.target.value }; setForm({ ...form, parcelas }); }} className={inputClass} />
                <input type="number" step="0.01" value={p.valor || ""} onChange={e => { const parcelas = [...form.parcelas]; parcelas[idx] = { ...parcelas[idx], valor: parseFloat(e.target.value) || 0 }; setForm({ ...form, parcelas }); }} className={inputClass} placeholder="Valor" />
                <button type="button" onClick={() => setForm({ ...form, parcelas: form.parcelas.filter((_, i) => i !== idx) })} className="text-destructive text-xs hover:underline">Remover</button>
              </div>
            ))}
            <button type="button" onClick={() => setForm({ ...form, parcelas: [...form.parcelas, { vencimento: "", valor: 0 }] })} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Adicionar parcela
            </button>
          </Section>

          {/* ─── REFERÊNCIAS ─── */}
          <Section title="Referências" icon="🔗" defaultOpen={false}>
            <div>
              <label className="block text-xs font-medium mb-1">Chave NF-e de Referência</label>
              <input type="text" value={form.nfReferencia} onChange={e => setForm({ ...form, nfReferencia: e.target.value })} className={inputClass} placeholder="44 dígitos da chave de acesso" maxLength={44} />
            </div>
          </Section>

          {/* ─── EXPORTAÇÃO ─── */}
          <Section title="Exportação" icon="🌎" defaultOpen={false}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">UF Saída País</label>
                <select value={form.ufSaidaPais} onChange={e => setForm({ ...form, ufSaidaPais: e.target.value })} className={inputClass}>
                  <option value="">Selecione</option>
                  {UF_OPTIONS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Local Despacho</label>
                <input type="text" value={form.localDespacho} onChange={e => setForm({ ...form, localDespacho: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Local de Embarque</label>
                <input type="text" value={form.localEmbarque} onChange={e => setForm({ ...form, localEmbarque: e.target.value })} className={inputClass} />
              </div>
            </div>
          </Section>

          {/* ─── ACTIONS ─── */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="button" onClick={handleEmit} disabled={emitting} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              <FileText className="w-4 h-4" />
              {emitting ? "Emitindo..." : "Emitir NF-e"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setForm(defaultForm()); }} className="px-5 py-2.5 rounded-lg border border-input text-sm font-medium hover:bg-accent transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ─── NOTES LIST ─── */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma nota fiscal emitida</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => {
            const st = statusMap[note.status] || statusMap.pending;
            const expanded = expandedId === note.id;
            return (
              <div key={note.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => setExpandedId(expanded ? null : note.id)} className="w-full flex items-center justify-between p-4 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                      {note.number && <span className="text-xs font-mono text-muted-foreground">Nº {note.number}</span>}
                    </div>
                    <p className="text-sm font-semibold truncate">{note.customer_name || "Consumidor Final"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleDateString("pt-BR")} · {fmt(note.total)}</p>
                  </div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
                {expanded && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    {note.error_message && (
                      <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg"><strong>Erro:</strong> {note.error_message}</div>
                    )}
                    {note.access_key && (
                      <div className="text-xs"><strong>Chave de Acesso:</strong><p className="font-mono text-[10px] break-all text-muted-foreground mt-0.5">{note.access_key}</p></div>
                    )}
                    {note.focus_ref && <p className="text-xs text-muted-foreground"><strong>Ref:</strong> {note.focus_ref}</p>}
                    {Array.isArray(note.items) && note.items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Itens:</p>
                        <div className="space-y-1">
                          {note.items.map((item: any, idx: number) => (
                            <p key={idx} className="text-xs text-muted-foreground">{item.quantity}x {item.name} — {fmt(item.price * item.quantity)}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(note.status === "processing" || note.status === "pending") && (
                        <button onClick={() => handleRefresh(note)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-input hover:bg-accent transition-colors">
                          <RefreshCw className="w-3.5 h-3.5" /> Atualizar Status
                        </button>
                      )}
                      {note.status === "authorized" && (
                        <>
                          {note.pdf_url && <a href={note.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-input hover:bg-accent transition-colors"><Eye className="w-3.5 h-3.5" /> Ver DANFE</a>}
                          {note.xml_url && <a href={note.xml_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-input hover:bg-accent transition-colors"><Download className="w-3.5 h-3.5" /> XML</a>}
                          <button onClick={() => handleCancel(note)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"><XCircle className="w-3.5 h-3.5" /> Cancelar NF-e</button>
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
