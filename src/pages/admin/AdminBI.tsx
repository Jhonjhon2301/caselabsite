import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, TrendingUp, Users, DollarSign, RefreshCw, Layers, PieChart as PieIcon,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid, AreaChart, Area
} from "recharts";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#a78bfa"];

export default function AdminBI() {
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [o, oi, p, pr, c] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("order_items").select("*"),
        supabase.from("products").select("*"),
        supabase.from("profiles").select("*"),
        supabase.from("categories").select("*"),
      ]);
      setOrders(o.data ?? []);
      setOrderItems(oi.data ?? []);
      setProducts(p.data ?? []);
      setProfiles(pr.data ?? []);
      setCategories(c.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const paidOrders = useMemo(() => orders.filter(o => o.payment_status === "paid"), [orders]);

  // LTV = total revenue / unique paying customers
  const ltv = useMemo(() => {
    const uniqueCustomers = new Set(paidOrders.map(o => o.user_id));
    if (uniqueCustomers.size === 0) return 0;
    const totalRev = paidOrders.reduce((s, o) => s + Number(o.total), 0);
    return totalRev / uniqueCustomers.size;
  }, [paidOrders]);

  // Repurchase rate
  const repurchaseRate = useMemo(() => {
    const customerOrders: Record<string, number> = {};
    paidOrders.forEach(o => { customerOrders[o.user_id] = (customerOrders[o.user_id] || 0) + 1; });
    const total = Object.keys(customerOrders).length;
    const repeat = Object.values(customerOrders).filter(c => c > 1).length;
    return total > 0 ? (repeat / total) * 100 : 0;
  }, [paidOrders]);

  // Recurring vs new customers
  const customerBreakdown = useMemo(() => {
    const customerOrders: Record<string, number> = {};
    paidOrders.forEach(o => { customerOrders[o.user_id] = (customerOrders[o.user_id] || 0) + 1; });
    const newC = Object.values(customerOrders).filter(c => c === 1).length;
    const repeatC = Object.values(customerOrders).filter(c => c > 1).length;
    return [
      { name: "Novos", value: newC },
      { name: "Recorrentes", value: repeatC },
    ];
  }, [paidOrders]);

  // Margin by product
  const marginByProduct = useMemo(() => {
    const paidIds = new Set(paidOrders.map(o => o.id));
    const soldItems = orderItems.filter(i => paidIds.has(i.order_id));
    const prodMap: Record<string, { name: string; revenue: number; cost: number; qty: number }> = {};

    soldItems.forEach(item => {
      const prod = products.find(p => p.id === item.product_id);
      const key = item.product_id || item.product_name;
      if (!prodMap[key]) prodMap[key] = { name: item.product_name, revenue: 0, cost: 0, qty: 0 };
      prodMap[key].revenue += Number(item.unit_price) * item.quantity;
      prodMap[key].cost += (prod ? Number(prod.purchase_cost) : 0) * item.quantity;
      prodMap[key].qty += item.quantity;
    });

    return Object.values(prodMap)
      .map(p => ({ ...p, margin: p.revenue - p.cost, marginPct: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidOrders, orderItems, products]);

  // Margin by category
  const marginByCategory = useMemo(() => {
    const catMap: Record<string, { name: string; revenue: number; cost: number }> = {};
    marginByProduct.forEach(p => {
      const prod = products.find(pr => pr.name === p.name);
      const cat = prod?.category_id ? categories.find(c => c.id === prod.category_id) : null;
      const catName = cat?.name || "Sem Categoria";
      if (!catMap[catName]) catMap[catName] = { name: catName, revenue: 0, cost: 0 };
      catMap[catName].revenue += p.revenue;
      catMap[catName].cost += p.cost;
    });
    return Object.values(catMap).map(c => ({
      ...c,
      margin: c.revenue - c.cost,
      marginPct: c.revenue > 0 ? ((c.revenue - c.cost) / c.revenue) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [marginByProduct, products, categories]);

  // ABC Curve
  const abcCurve = useMemo(() => {
    const totalRev = marginByProduct.reduce((s, p) => s + p.revenue, 0);
    let cum = 0;
    return marginByProduct.map(p => {
      cum += p.revenue;
      const cumPct = totalRev > 0 ? (cum / totalRev) * 100 : 0;
      const cls = cumPct <= 80 ? "A" : cumPct <= 95 ? "B" : "C";
      return { ...p, cumPct, class: cls };
    });
  }, [marginByProduct]);

  // Cohort by month
  const cohort = useMemo(() => {
    const map: Record<string, number> = {};
    profiles.forEach(p => {
      const m = new Date(p.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).map(([month, count]) => ({ month, count })).slice(-12);
  }, [profiles]);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> BI Avançado
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Inteligência estratégica do negócio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
            <p className="text-xs text-muted-foreground">LTV Médio</p>
          </div>
          <p className="text-lg font-bold">{fmt(ltv)}</p>
          <p className="text-[10px] text-muted-foreground">receita / cliente</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"><RefreshCw className="w-4 h-4 text-blue-600" /></div>
            <p className="text-xs text-muted-foreground">Taxa Recompra</p>
          </div>
          <p className="text-lg font-bold">{repurchaseRate.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground">clientes com 2+ compras</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30"><Users className="w-4 h-4 text-violet-600" /></div>
            <p className="text-xs text-muted-foreground">Clientes Recorrentes</p>
          </div>
          <p className="text-lg font-bold">{customerBreakdown[1]?.value || 0}</p>
          <p className="text-[10px] text-muted-foreground">de {(customerBreakdown[0]?.value || 0) + (customerBreakdown[1]?.value || 0)} únicos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Layers className="w-4 h-4 text-amber-600" /></div>
            <p className="text-xs text-muted-foreground">Produtos Classe A</p>
          </div>
          <p className="text-lg font-bold">{abcCurve.filter(p => p.class === "A").length}</p>
          <p className="text-[10px] text-muted-foreground">80% do faturamento</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Clientes Novos vs Recorrentes */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Novos vs Recorrentes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={customerBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                {customerBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {customerBreakdown.map((c, i) => (
              <span key={c.name} className="text-xs flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                {c.name}: {c.value}
              </span>
            ))}
          </div>
        </div>

        {/* Cohort */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Cohort — Clientes por Mês</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cohort}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" name="Novos clientes" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Margin by category */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h3 className="font-heading font-semibold text-sm mb-4">Margem por Categoria</h3>
        {marginByCategory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={marginByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Receita" radius={[4, 4, 0, 0]} />
              <Bar dataKey="margin" fill="#10b981" name="Margem" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ABC Curve Table */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h3 className="font-heading font-semibold text-sm mb-4">Curva ABC de Produtos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Classe</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Produto</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qtd</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Receita</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Margem</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Margem %</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Acum. %</th>
              </tr>
            </thead>
            <tbody>
              {abcCurve.slice(0, 20).map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      p.class === "A" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" :
                      p.class === "B" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30"
                    }`}>{p.class}</span>
                  </td>
                  <td className="px-3 py-2 font-medium truncate max-w-[200px]">{p.name}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{p.qty}</td>
                  <td className="px-3 py-2 text-right">{fmt(p.revenue)}</td>
                  <td className="px-3 py-2 text-right text-emerald-600">{fmt(p.margin)}</td>
                  <td className="px-3 py-2 text-right">{p.marginPct.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{p.cumPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Margin by product (full table) */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h3 className="font-heading font-semibold text-sm mb-4">Margem por Produto</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Produto</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Qtd</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Receita</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Custo</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">Margem</th>
                <th className="text-right px-3 py-2 font-medium text-muted-foreground">%</th>
              </tr>
            </thead>
            <tbody>
              {marginByProduct.map((p, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium truncate max-w-[200px]">{p.name}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{p.qty}</td>
                  <td className="px-3 py-2 text-right">{fmt(p.revenue)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{fmt(p.cost)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${p.margin >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(p.margin)}</td>
                  <td className="px-3 py-2 text-right">{p.marginPct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
