import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";
import { Users, Download, Search, Check, X, ShoppingBag, Instagram, MapPin, Calendar, Phone, Mail, CreditCard, Pencil, Trash2, Save, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  birth_date: string | null;
  gender: string | null;
  instagram: string | null;
  address_cep: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  customer_name: string | null;
}

const ALL_COLUMNS = [
  { key: "full_name", label: "Nome" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
  { key: "cpf", label: "CPF" },
  { key: "instagram", label: "Instagram" },
  { key: "created_at", label: "Data de Cadastro" },
] as const;

type ColKey = (typeof ALL_COLUMNS)[number]["key"];

function toCsv(rows: Profile[], cols: ColKey[]) {
  const header = cols.map((c) => ALL_COLUMNS.find((a) => a.key === c)!.label).join(",");
  const body = rows.map((r) =>
    cols.map((c) => {
      let v = (r as any)[c] ?? "";
      if (c === "created_at") v = new Date(v).toLocaleDateString("pt-BR");
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [header, ...body].join("\n");
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  processing: "Em Produção",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const GENDER_LABELS: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  outro: "Outro",
  prefiro_nao_dizer: "Prefiro não dizer",
};

export default function AdminCustomers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCols, setSelectedCols] = useState<Set<ColKey>>(new Set(ALL_COLUMNS.map((c) => c.key)));
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error("Erro ao carregar clientes");
      else setProfiles(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return profiles;
    const q = search.toLowerCase();
    return profiles.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.cpf?.includes(q) ||
        p.instagram?.toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const openCustomerDetail = async (profile: Profile) => {
    setSelectedCustomer(profile);
    setLoadingOrders(true);
    const { data } = await supabase
      .from("orders")
      .select("id, status, payment_status, total, created_at, customer_name")
      .eq("user_id", profile.user_id)
      .order("created_at", { ascending: false });
    setCustomerOrders((data as Order[]) || []);
    setLoadingOrders(false);
  };

  const toggleCol = (key: ColKey) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  const downloadCsv = () => {
    const cols = ALL_COLUMNS.map((c) => c.key).filter((k) => selectedCols.has(k));
    const csv = toCsv(filtered, cols);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} clientes exportados`);
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none";

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const startEdit = () => {
    if (!selectedCustomer) return;
    setEditForm({ ...selectedCustomer });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!selectedCustomer) return;
    setSavingEdit(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name?.trim() || null,
      phone: editForm.phone?.trim() || null,
      cpf: editForm.cpf?.trim() || null,
      birth_date: editForm.birth_date || null,
      gender: editForm.gender || null,
      instagram: editForm.instagram?.trim() || null,
      address_cep: editForm.address_cep?.trim() || null,
      address_street: editForm.address_street?.trim() || null,
      address_number: editForm.address_number?.trim() || null,
      address_complement: editForm.address_complement?.trim() || null,
      address_neighborhood: editForm.address_neighborhood?.trim() || null,
      address_city: editForm.address_city?.trim() || null,
      address_state: editForm.address_state?.trim() || null,
    }).eq("id", selectedCustomer.id);

    if (error) { toast.error("Erro ao salvar"); setSavingEdit(false); return; }
    await logAudit("update_customer", "profile", selectedCustomer.id, { name: editForm.full_name });
    toast.success("Cliente atualizado!");
    const updated = { ...selectedCustomer, ...editForm } as Profile;
    setSelectedCustomer(updated);
    setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditing(false);
    setSavingEdit(false);
  };

  const deleteCustomer = async (profile: Profile) => {
    if (!confirm(`Tem certeza que deseja EXCLUIR o cliente "${profile.full_name || profile.email}"? Os dados do perfil serão removidos permanentemente.`)) return;
    const { error } = await supabase.from("profiles").delete().eq("id", profile.id);
    if (error) { toast.error("Erro ao excluir cliente: " + error.message); return; }
    await logAudit("delete_customer", "profile", profile.id, { name: profile.full_name, email: profile.email });
    toast.success("Cliente excluído!");
    setProfiles(prev => prev.filter(p => p.id !== profile.id));
    if (selectedCustomer?.id === profile.id) setSelectedCustomer(null);
  };

  // Customer detail drawer
  if (selectedCustomer) {
    const p = selectedCustomer;
    const hasAddress = p.address_cep || p.address_street || p.address_city;
    return (
      <div className="p-4 sm:p-8">
        <button onClick={() => { setSelectedCustomer(null); setEditing(false); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <X className="w-4 h-4" /> Voltar para a lista
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                  {(p.full_name || "?")[0]?.toUpperCase()}
                </div>
                <div className="flex gap-1.5">
                  {editing ? (
                    <button onClick={saveEdit} disabled={savingEdit} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                      {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                    </button>
                  ) : (
                    <button onClick={startEdit} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors">
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                  )}
                  <button onClick={() => deleteCustomer(p)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-destructive/30 text-destructive rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {editing ? (
                <div className="space-y-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">Nome</label><input type="text" value={editForm.full_name || ""} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className={inputClass} /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Telefone</label><input type="text" value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} className={inputClass} /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">CPF</label><input type="text" value={editForm.cpf || ""} onChange={e => setEditForm({...editForm, cpf: e.target.value})} className={inputClass} /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Nascimento</label><input type="date" value={editForm.birth_date || ""} onChange={e => setEditForm({...editForm, birth_date: e.target.value})} className={inputClass} /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Gênero</label>
                    <select value={editForm.gender || ""} onChange={e => setEditForm({...editForm, gender: e.target.value})} className={inputClass}>
                      <option value="">—</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                      <option value="prefiro_nao_dizer">Prefiro não dizer</option>
                    </select>
                  </div>
                  <div><label className="block text-xs text-muted-foreground mb-1">Instagram</label><input type="text" value={editForm.instagram || ""} onChange={e => setEditForm({...editForm, instagram: e.target.value})} className={inputClass} /></div>
                  <div className="border-t border-border pt-3 mt-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Endereço</p>
                    <div className="space-y-2">
                      <div><label className="block text-xs text-muted-foreground mb-1">CEP</label><input type="text" value={editForm.address_cep || ""} onChange={e => setEditForm({...editForm, address_cep: e.target.value})} className={inputClass} /></div>
                      <div><label className="block text-xs text-muted-foreground mb-1">Rua</label><input type="text" value={editForm.address_street || ""} onChange={e => setEditForm({...editForm, address_street: e.target.value})} className={inputClass} /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="block text-xs text-muted-foreground mb-1">Nº</label><input type="text" value={editForm.address_number || ""} onChange={e => setEditForm({...editForm, address_number: e.target.value})} className={inputClass} /></div>
                        <div><label className="block text-xs text-muted-foreground mb-1">Compl.</label><input type="text" value={editForm.address_complement || ""} onChange={e => setEditForm({...editForm, address_complement: e.target.value})} className={inputClass} /></div>
                      </div>
                      <div><label className="block text-xs text-muted-foreground mb-1">Bairro</label><input type="text" value={editForm.address_neighborhood || ""} onChange={e => setEditForm({...editForm, address_neighborhood: e.target.value})} className={inputClass} /></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2"><label className="block text-xs text-muted-foreground mb-1">Cidade</label><input type="text" value={editForm.address_city || ""} onChange={e => setEditForm({...editForm, address_city: e.target.value})} className={inputClass} /></div>
                        <div><label className="block text-xs text-muted-foreground mb-1">UF</label><input type="text" value={editForm.address_state || ""} onChange={e => setEditForm({...editForm, address_state: e.target.value.toUpperCase().slice(0, 2)})} className={inputClass} maxLength={2} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="font-heading text-xl font-bold">{p.full_name || "Sem nome"}</h2>
                  <p className="text-xs text-muted-foreground mt-1">Cadastrado em {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                  <div className="mt-5 space-y-3 text-sm">
                    {p.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4 shrink-0" /> {p.email}</div>}
                    {p.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4 shrink-0" /> {p.phone}</div>}
                    {p.cpf && <div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="w-4 h-4 shrink-0" /> {p.cpf}</div>}
                    {p.birth_date && <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4 shrink-0" /> {new Date(p.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}</div>}
                    {p.gender && <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4 shrink-0" /> {GENDER_LABELS[p.gender] || p.gender}</div>}
                    {p.instagram && <div className="flex items-center gap-2 text-muted-foreground"><Instagram className="w-4 h-4 shrink-0" /> {p.instagram}</div>}
                  </div>
                </>
              )}
            </div>

            {!editing && hasAddress && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3"><MapPin className="w-4 h-4" /> Endereço</h3>
                <p className="text-sm text-muted-foreground">{p.address_street}{p.address_number ? `, ${p.address_number}` : ""}{p.address_complement ? ` - ${p.address_complement}` : ""}</p>
                <p className="text-sm text-muted-foreground">{p.address_neighborhood}{p.address_city ? `, ${p.address_city}` : ""}{p.address_state ? ` - ${p.address_state}` : ""}</p>
                {p.address_cep && <p className="text-sm text-muted-foreground">CEP: {p.address_cep}</p>}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2 mb-4"><ShoppingBag className="w-5 h-5" /> Pedidos ({customerOrders.length})</h3>
              {loadingOrders ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
              ) : customerOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum pedido encontrado</p>
              ) : (
                <div className="space-y-3">
                  {customerOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium">Pedido #{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">R$ {Number(o.total).toFixed(2)}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.status === "delivered" ? "bg-green-100 text-green-700" : o.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {STATUS_LABELS[o.status] || o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Clientes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{profiles.length} cadastros no total</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar por nome, email, telefone, CPF ou Instagram..." value={search} onChange={(e) => setSearch(e.target.value)} className={`${inputClass} pl-9`} />
        </div>
        <button onClick={downloadCsv} disabled={filtered.length === 0} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <span className="text-xs font-medium text-muted-foreground self-center mr-1">Colunas:</span>
        {ALL_COLUMNS.map((col) => {
          const active = selectedCols.has(col.key);
          return (
            <button key={col.key} onClick={() => toggleCol(col.key)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-input text-muted-foreground hover:bg-accent"}`}>
              {active && <Check className="w-3 h-3" />}
              {col.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {ALL_COLUMNS.filter((c) => selectedCols.has(c.key)).map((col) => (
                  <th key={col.key} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} onClick={() => openCustomerDetail(p)} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  {selectedCols.has("full_name") && <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>}
                  {selectedCols.has("email") && <td className="px-4 py-3 text-muted-foreground">{p.email || "—"}</td>}
                  {selectedCols.has("phone") && <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>}
                  {selectedCols.has("cpf") && <td className="px-4 py-3 text-muted-foreground">{p.cpf || "—"}</td>}
                  {selectedCols.has("instagram") && <td className="px-4 py-3 text-muted-foreground">{p.instagram || "—"}</td>}
                  {selectedCols.has("created_at") && <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
