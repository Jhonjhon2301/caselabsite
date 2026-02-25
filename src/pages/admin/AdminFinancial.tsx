import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, BarChart3, ShoppingBag, CheckCircle, Clock, X, Repeat, ToggleLeft, ToggleRight } from "lucide-react";

interface OrderWithItems {
  id: string;
  total: number;
  subtotal: number;
  discount: number;
  status: string;
  created_at: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  expense_date: string;
  due_date: string | null;
  status: string;
  created_at: string;
}

interface ManualSale {
  id: string;
  description: string;
  amount: number;
  sale_date: string;
  customer_name: string | null;
  notes: string | null;
  created_at: string;
}

interface FixedExpense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  recurrence: string;
  day_of_month: number | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminFinancial() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [manualSales, setManualSales] = useState<ManualSale[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showFixedForm, setShowFixedForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"sales" | "expenses" | "fixed">("sales");
  const [expForm, setExpForm] = useState({ description: "", amount: "", category: "", expense_date: new Date().toISOString().split("T")[0], due_date: "" });
  const [saleForm, setSaleForm] = useState({ description: "", amount: "", customer_name: "", sale_date: new Date().toISOString().split("T")[0], notes: "" });
  const [fixedForm, setFixedForm] = useState({ description: "", amount: "", category: "", recurrence: "monthly", day_of_month: "1" });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: ords }, { data: exps }, { data: sales }, { data: fixed }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
      supabase.from("manual_sales").select("*").order("sale_date", { ascending: false }),
      supabase.from("fixed_expenses").select("*").order("description"),
    ]);
    setOrders((ords as any[]) ?? []);
    setExpenses((exps as any[]) ?? []);
    setManualSales((sales as any[]) ?? []);
    setFixedExpenses((fixed as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredOrders = useMemo(() => {
    if (period === "all") return orders;
    const days = period === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return orders.filter((o) => new Date(o.created_at) >= cutoff);
  }, [orders, period]);

  const filteredExpenses = useMemo(() => {
    if (period === "all") return expenses;
    const days = period === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return expenses.filter((e) => new Date(e.expense_date) >= cutoff);
  }, [expenses, period]);

  const filteredSales = useMemo(() => {
    if (period === "all") return manualSales;
    const days = period === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return manualSales.filter((s) => new Date(s.sale_date) >= cutoff);
  }, [manualSales, period]);

  const totalOnlineRevenue = filteredOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const totalManualRevenue = filteredSales.reduce((s, sale) => s + Number(sale.amount), 0);
  const totalRevenue = totalOnlineRevenue + totalManualRevenue;
  const totalExpensesVal = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalFixedMonthly = fixedExpenses.filter(f => f.is_active).reduce((s, f) => s + Number(f.amount), 0);
  const profit = totalRevenue - totalExpensesVal;
  const pendingExpenses = filteredExpenses.filter((e) => e.status === "pending");
  const overdueExpenses = pendingExpenses.filter((e) => e.due_date && new Date(e.due_date) < new Date());

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.description.trim() || !expForm.amount) { toast.error("Preencha descrição e valor"); return; }
    const { error } = await supabase.from("expenses").insert({
      description: expForm.description.trim(),
      amount: parseFloat(expForm.amount),
      category: expForm.category.trim() || null,
      expense_date: expForm.expense_date,
      due_date: expForm.due_date || null,
      status: "pending",
      created_by: user!.id,
    });
    if (error) { toast.error("Erro ao salvar despesa"); return; }
    toast.success("Despesa registrada!");
    setShowExpenseForm(false);
    setExpForm({ description: "", amount: "", category: "", expense_date: new Date().toISOString().split("T")[0], due_date: "" });
    fetchData();
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleForm.description.trim() || !saleForm.amount) { toast.error("Preencha descrição e valor"); return; }
    const { error } = await supabase.from("manual_sales").insert({
      description: saleForm.description.trim(),
      amount: parseFloat(saleForm.amount),
      customer_name: saleForm.customer_name.trim() || null,
      sale_date: saleForm.sale_date,
      notes: saleForm.notes.trim() || null,
      created_by: user!.id,
    });
    if (error) { toast.error("Erro ao salvar venda"); return; }
    toast.success("Venda registrada!");
    setShowSaleForm(false);
    setSaleForm({ description: "", amount: "", customer_name: "", sale_date: new Date().toISOString().split("T")[0], notes: "" });
    fetchData();
  };

  const handleAddFixed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedForm.description.trim() || !fixedForm.amount) { toast.error("Preencha descrição e valor"); return; }
    const { error } = await supabase.from("fixed_expenses").insert({
      description: fixedForm.description.trim(),
      amount: parseFloat(fixedForm.amount),
      category: fixedForm.category.trim() || null,
      recurrence: fixedForm.recurrence,
      day_of_month: parseInt(fixedForm.day_of_month) || 1,
      created_by: user!.id,
    });
    if (error) { toast.error("Erro ao salvar gasto fixo"); return; }
    toast.success("Gasto fixo registrado!");
    setShowFixedForm(false);
    setFixedForm({ description: "", amount: "", category: "", recurrence: "monthly", day_of_month: "1" });
    fetchData();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    toast.success("Despesa removida");
    fetchData();
  };

  const handleDeleteSale = async (id: string) => {
    if (!confirm("Excluir esta venda?")) return;
    await supabase.from("manual_sales").delete().eq("id", id);
    toast.success("Venda removida");
    fetchData();
  };

  const handleDeleteFixed = async (id: string) => {
    if (!confirm("Excluir este gasto fixo?")) return;
    await supabase.from("fixed_expenses").delete().eq("id", id);
    toast.success("Gasto fixo removido");
    fetchData();
  };

  const handleToggleExpenseStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "paid" ? "pending" : "paid";
    await supabase.from("expenses").update({ status: newStatus }).eq("id", id);
    toast.success(newStatus === "paid" ? "Despesa marcada como paga" : "Despesa marcada como pendente");
    fetchData();
  };

  const handleToggleFixedActive = async (id: string, currentActive: boolean) => {
    await supabase.from("fixed_expenses").update({ is_active: !currentActive }).eq("id", id);
    toast.success(!currentActive ? "Gasto fixo ativado" : "Gasto fixo desativado");
    fetchData();
  };

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const isOverdue = (exp: Expense) => exp.status === "pending" && exp.due_date && new Date(exp.due_date) < new Date();
  const recurrenceLabel: Record<string, string> = { monthly: "Mensal", weekly: "Semanal", yearly: "Anual" };

  if (loading) return <div className="p-8"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Visão geral de receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "Tudo"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-100"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <p className="text-sm text-muted-foreground">Receita Total</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{fmt(totalRevenue)}</p>
          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
            <span>Site: {fmt(totalOnlineRevenue)}</span>
            <span>•</span>
            <span>Externas: {fmt(totalManualRevenue)}</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-100"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            <p className="text-sm text-muted-foreground">Despesas</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{fmt(totalExpensesVal)}</p>
          {overdueExpenses.length > 0 && (
            <p className="text-xs text-red-500 mt-1">⚠ {overdueExpenses.length} vencida(s)</p>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-100"><Repeat className="w-5 h-5 text-purple-600" /></div>
            <p className="text-sm text-muted-foreground">Gastos Fixos/mês</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">{fmt(totalFixedMonthly)}</p>
          <p className="text-xs text-muted-foreground mt-1">{fixedExpenses.filter(f => f.is_active).length} ativo(s)</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-100"><DollarSign className="w-5 h-5 text-blue-600" /></div>
            <p className="text-sm text-muted-foreground">Lucro</p>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? "text-blue-600" : "text-red-600"}`}>{fmt(profit)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="w-5 h-5 text-primary" /></div>
            <p className="text-sm text-muted-foreground">Pedidos (Site)</p>
          </div>
          <p className="text-2xl font-bold">{filteredOrders.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        <button onClick={() => setActiveTab("sales")} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${activeTab === "sales" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
          <ShoppingBag className="w-4 h-4" /> Vendas Externas ({filteredSales.length})
        </button>
        <button onClick={() => setActiveTab("expenses")} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${activeTab === "expenses" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
          <TrendingDown className="w-4 h-4" /> Despesas ({filteredExpenses.length})
          {overdueExpenses.length > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{overdueExpenses.length}</span>}
        </button>
        <button onClick={() => setActiveTab("fixed")} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shrink-0 ${activeTab === "fixed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
          <Repeat className="w-4 h-4" /> Gastos Fixos ({fixedExpenses.length})
        </button>
      </div>

      {/* Manual Sales Tab */}
      {activeTab === "sales" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Vendas Externas</h2>
            <button onClick={() => setShowSaleForm(!showSaleForm)} className="btn-primary text-xs">
              {showSaleForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showSaleForm ? "Cancelar" : "Nova Venda"}
            </button>
          </div>

          {showSaleForm && (
            <form onSubmit={handleAddSale} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
              <input type="text" placeholder="Descrição da venda *" value={saleForm.description} onChange={(e) => setSaleForm({ ...saleForm, description: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" required maxLength={200} />
              <input type="number" step="0.01" min="0.01" placeholder="Valor (R$) *" value={saleForm.amount} onChange={(e) => setSaleForm({ ...saleForm, amount: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" required />
              <input type="text" placeholder="Nome do cliente" value={saleForm.customer_name} onChange={(e) => setSaleForm({ ...saleForm, customer_name: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" maxLength={100} />
              <input type="date" value={saleForm.sale_date} onChange={(e) => setSaleForm({ ...saleForm, sale_date: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" />
              <input type="text" placeholder="Observações" value={saleForm.notes} onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" maxLength={500} />
              <div className="flex justify-end">
                <button type="submit" className="btn-primary text-xs">Salvar Venda</button>
              </div>
            </form>
          )}

          {filteredSales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma venda externa registrada</p>
          ) : (
            <div className="space-y-2">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{sale.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.sale_date).toLocaleDateString("pt-BR")}
                      {sale.customer_name && ` · ${sale.customer_name}`}
                      {sale.notes && ` · ${sale.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-green-600">+ {fmt(Number(sale.amount))}</span>
                    <button onClick={() => handleDeleteSale(sale.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Despesas</h2>
            <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="btn-primary text-xs">
              {showExpenseForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showExpenseForm ? "Cancelar" : "Nova Despesa"}
            </button>
          </div>

          {showExpenseForm && (
            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
              <input type="text" placeholder="Descrição *" value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" required maxLength={200} />
              <input type="number" step="0.01" min="0.01" placeholder="Valor (R$) *" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" required />
              <input type="text" placeholder="Categoria" value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" maxLength={50} />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Data da despesa</label>
                <input type="date" value={expForm.expense_date} onChange={(e) => setExpForm({ ...expForm, expense_date: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Data de vencimento</label>
                <input type="date" value={expForm.due_date} onChange={(e) => setExpForm({ ...expForm, due_date: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary text-xs w-full">Salvar Despesa</button>
              </div>
            </form>
          )}

          {filteredExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma despesa registrada</p>
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((ex) => (
                <div key={ex.id} className={`flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors ${isOverdue(ex) ? "border border-red-300 bg-red-50/50 dark:bg-red-950/20" : ""}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleToggleExpenseStatus(ex.id, ex.status)} className={`p-1 rounded-full transition-colors ${ex.status === "paid" ? "text-green-600" : "text-muted-foreground hover:text-foreground"}`} title={ex.status === "paid" ? "Pago" : "Marcar como pago"}>
                      {ex.status === "paid" ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${ex.status === "paid" ? "line-through text-muted-foreground" : ""}`}>{ex.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ex.expense_date).toLocaleDateString("pt-BR")}
                        {ex.category && ` · ${ex.category}`}
                        {ex.due_date && (
                          <span className={isOverdue(ex) ? "text-red-500 font-semibold" : ""}>
                            {" "}· Vence: {new Date(ex.due_date).toLocaleDateString("pt-BR")}
                            {isOverdue(ex) && " (VENCIDA)"}
                          </span>
                        )}
                        {ex.status === "paid" && <span className="text-green-600"> · Pago ✓</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-red-600">- {fmt(Number(ex.amount))}</span>
                    <button onClick={() => handleDeleteExpense(ex.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fixed Expenses Tab */}
      {activeTab === "fixed" && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-heading font-bold text-lg">Gastos Fixos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Despesas recorrentes como aluguel, internet, etc.</p>
            </div>
            <button onClick={() => setShowFixedForm(!showFixedForm)} className="btn-primary text-xs">
              {showFixedForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showFixedForm ? "Cancelar" : "Novo Gasto Fixo"}
            </button>
          </div>

          {showFixedForm && (
            <form onSubmit={handleAddFixed} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
              <input type="text" placeholder="Descrição * (ex: Aluguel)" value={fixedForm.description} onChange={(e) => setFixedForm({ ...fixedForm, description: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" required maxLength={200} />
              <input type="number" step="0.01" min="0.01" placeholder="Valor (R$) *" value={fixedForm.amount} onChange={(e) => setFixedForm({ ...fixedForm, amount: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" required />
              <input type="text" placeholder="Categoria (ex: Infraestrutura)" value={fixedForm.category} onChange={(e) => setFixedForm({ ...fixedForm, category: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" maxLength={50} />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Recorrência</label>
                <select value={fixedForm.recurrence} onChange={(e) => setFixedForm({ ...fixedForm, recurrence: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm">
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Dia do vencimento</label>
                <input type="number" min="1" max="31" value={fixedForm.day_of_month} onChange={(e) => setFixedForm({ ...fixedForm, day_of_month: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" />
              </div>
              <div className="flex items-end">
                <button type="submit" className="btn-primary text-xs w-full">Salvar Gasto Fixo</button>
              </div>
            </form>
          )}

          {fixedExpenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum gasto fixo registrado</p>
          ) : (
            <div className="space-y-2">
              {fixedExpenses.map((fx) => (
                <div key={fx.id} className={`flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors ${!fx.is_active ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleToggleFixedActive(fx.id, fx.is_active)} className={`transition-colors ${fx.is_active ? "text-green-600" : "text-muted-foreground"}`} title={fx.is_active ? "Desativar" : "Ativar"}>
                      {fx.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                    <div>
                      <p className="text-sm font-medium">{fx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {recurrenceLabel[fx.recurrence] || fx.recurrence}
                        {fx.day_of_month && ` · Dia ${fx.day_of_month}`}
                        {fx.category && ` · ${fx.category}`}
                        {!fx.is_active && " · Inativo"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-purple-600">{fmt(Number(fx.amount))}</span>
                    <button onClick={() => handleDeleteFixed(fx.id)} className="p-1.5 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
