import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Calendar, Hash, ShieldCheck, ShieldOff } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "", discount_type: "percentage", discount_value: "", min_order_value: "", max_uses: "", is_active: true, expires_at: "",
  });

  const fetchCoupons = async () => {
    setLoading(true);
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    setCoupons((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", discount_type: "percentage", discount_value: "", min_order_value: "", max_uses: "", is_active: true, expires_at: "" });
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_value: c.min_order_value ? String(c.min_order_value) : "",
      max_uses: c.max_uses ? String(c.max_uses) : "",
      is_active: c.is_active,
      expires_at: c.expires_at ? c.expires_at.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discount_value) {
      toast.error("Preencha código e valor do desconto");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      is_active: form.is_active,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    if (editing) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Cupom atualizado!");
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) { toast.error(error.message.includes("duplicate") ? "Código já existe" : "Erro ao criar"); return; }
      toast.success("Cupom criado!");
    }
    setShowForm(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    toast.success("Cupom excluído!");
    fetchCoupons();
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success(c.is_active ? "Cupom desativado" : "Cupom ativado");
    fetchCoupons();
  };

  const presets = [5, 10, 15, 20, 25, 30, 50];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Cupons de Desconto</h1>
          <p className="text-sm text-muted-foreground">{coupons.length} cupom(ns) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Novo Cupom</button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <h2 className="font-heading font-bold text-lg mb-6">{editing ? "Editar Cupom" : "Criar Novo Cupom"}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code */}
            <div>
              <label className="block text-sm font-semibold mb-2">Código do Cupom *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Ex: PROMO10, BEMVINDO, NATAL2024"
                className="w-full max-w-sm px-4 py-3 rounded-lg border border-input bg-background text-sm uppercase font-mono tracking-wider focus:ring-2 focus:ring-ring outline-none"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">O código que o cliente digita no checkout</p>
            </div>

            {/* Discount type toggle */}
            <div>
              <label className="block text-sm font-semibold mb-2">Tipo de Desconto</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, discount_type: "percentage", discount_value: "" })}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    form.discount_type === "percentage"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  <Percent className="w-4 h-4" /> Porcentagem
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, discount_type: "fixed", discount_value: "" })}
                  className={`flex items-center gap-2 px-5 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                    form.discount_type === "fixed"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  <DollarSign className="w-4 h-4" /> Valor Fixo (R$)
                </button>
              </div>
            </div>

            {/* Discount value with presets */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                {form.discount_type === "percentage" ? "Porcentagem de Desconto *" : "Valor do Desconto (R$) *"}
              </label>
              {form.discount_type === "percentage" && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, discount_value: String(p) })}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        form.discount_value === String(p)
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              )}
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={form.discount_type === "percentage" ? "100" : undefined}
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  placeholder={form.discount_type === "percentage" ? "Ex: 15" : "Ex: 25.00"}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  {form.discount_type === "percentage" ? "%" : "R$"}
                </span>
              </div>
            </div>

            {/* Conditions */}
            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Condições (opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Pedido mínimo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.min_order_value}
                    onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" /> Máx. de usos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Data de expiração
                  </label>
                  <input
                    type="date"
                    value={form.expires_at}
                    onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded w-5 h-5 text-primary" />
              <span className="font-medium">Cupom ativo</span>
              <span className="text-xs text-muted-foreground">(desmarque para desativar sem excluir)</span>
            </label>

            {/* Preview */}
            {form.code && form.discount_value && (
              <div className="bg-secondary rounded-xl p-4 border border-border">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Pré-visualização</p>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-lg text-primary">{form.code.toUpperCase() || "CÓDIGO"}</span>
                  <span className="text-foreground font-semibold">
                    {form.discount_type === "percentage" ? `${form.discount_value}% de desconto` : `R$ ${Number(form.discount_value || 0).toFixed(2)} de desconto`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.min_order_value ? `Pedido mínimo: R$ ${Number(form.min_order_value).toFixed(2)}` : "Sem pedido mínimo"}
                  {form.max_uses ? ` · Máx. ${form.max_uses} uso(s)` : " · Usos ilimitados"}
                  {form.expires_at ? ` · Expira em ${new Date(form.expires_at).toLocaleDateString("pt-BR")}` : " · Sem expiração"}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary">{editing ? "Salvar Alterações" : "Criar Cupom"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-muted-foreground">Carregando...</p> : coupons.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhum cupom cadastrado</p>
          <p className="text-sm mt-1">Crie seu primeiro cupom de desconto!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {coupons.map((c) => {
            const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
            const isMaxedOut = c.max_uses && c.current_uses >= c.max_uses;
            return (
              <div key={c.id} className={`bg-card border rounded-xl p-5 flex items-center gap-4 transition-all ${!c.is_active || isExpired || isMaxedOut ? "border-border opacity-60" : "border-primary/20 shadow-sm"}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.discount_type === "percentage" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"}`}>
                  {c.discount_type === "percentage" ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-base">{c.code}</span>
                    {c.is_active && !isExpired && !isMaxedOut ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase">Ativo</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase">
                        {isExpired ? "Expirado" : isMaxedOut ? "Esgotado" : "Inativo"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground font-semibold mt-0.5">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : `R$ ${Number(c.discount_value).toFixed(2)}`} de desconto
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {Number(c.min_order_value) > 0 && `Mín. R$ ${Number(c.min_order_value).toFixed(2)} · `}
                    {c.max_uses ? `${c.current_uses}/${c.max_uses} usos` : `${c.current_uses} uso(s)`}
                    {c.expires_at && ` · Expira ${new Date(c.expires_at).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleActive(c)} className="p-2 hover:bg-muted rounded-lg" title={c.is_active ? "Desativar" : "Ativar"}>
                    {c.is_active ? <ShieldCheck className="w-4 h-4 text-green-600" /> : <ShieldOff className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  <button onClick={() => openEdit(c)} className="p-2 hover:bg-muted rounded-lg"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
