import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, BarChart3 } from "lucide-react";

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
  created_at: string;
}

export default function AdminFinancial() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expForm, setExpForm] = useState({ description: "", amount: "", category: "", expense_date: new Date().toISOString().split("T")[0] });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: ords }, { data: exps }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
    ]);
    setOrders((ords as any[]) ?? []);
    setExpenses((exps as any[]) ?? []);
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

  const totalRevenue = filteredOrders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = totalRevenue - totalExpenses;
  const totalOrders = filteredOrders.length;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expForm.description.trim() || !expForm.amount) { toast.error("Preencha descrição e valor"); return; }
    const { error } = await supabase.from("expenses").insert({
      description: expForm.description.trim(),
      amount: parseFloat(expForm.amount),
      category: expForm.category.trim() || null,
      expense_date: expForm.expense_date,
      created_by: user!.id,
    });
    if (error) { toast.error("Erro ao salvar despesa"); return; }
    toast.success("Despesa registrada!");
    setShowExpenseForm(false);
    setExpForm({ description: "", amount: "", category: "", expense_date: new Date().toISOString().split("T")[0] });
    fetchData();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    await supabase.from("expenses").delete().eq("id", id);
    toast.success("Despesa removida");
    fetchData();
  };

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-100"><TrendingUp className="w-5 h-5 text-green-600" /></div>
            <p className="text-sm text-muted-foreground">Receita</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-100"><TrendingDown className="w-5 h-5 text-red-600" /></div>
            <p className="text-sm text-muted-foreground">Despesas</p>
          </div>
          <p className="text-2xl font-bold text-red-600">{fmt(totalExpenses)}</p>
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
            <p className="text-sm text-muted-foreground">Pedidos</p>
          </div>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg">Despesas</h2>
          <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="btn-primary text-xs">
            <Plus className="w-4 h-4" /> Nova Despesa
          </button>
        </div>

        {showExpenseForm && (
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 p-4 bg-muted/50 rounded-lg">
            <input type="text" placeholder="Descrição *" value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" required />
            <input type="number" step="0.01" min="0" placeholder="Valor (R$) *" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" required />
            <input type="text" placeholder="Categoria" value={expForm.category} onChange={(e) => setExpForm({ ...expForm, category: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm" />
            <div className="flex gap-2">
              <input type="date" value={expForm.expense_date} onChange={(e) => setExpForm({ ...expForm, expense_date: e.target.value })} className="px-3 py-2 rounded-lg border border-input bg-background text-sm flex-1" />
              <button type="submit" className="btn-primary text-xs">Salvar</button>
            </div>
          </form>
        )}

        {filteredExpenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma despesa registrada</p>
        ) : (
          <div className="space-y-2">
            {filteredExpenses.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{ex.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ex.expense_date).toLocaleDateString("pt-BR")}
                    {ex.category && ` · ${ex.category}`}
                  </p>
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
    </div>
  );
}
