import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown,
  AlertTriangle, Tag, Truck, ArrowUpRight, ArrowDownRight, BarChart3,
  CreditCard, Star
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

interface DashboardData {
  orders: any[];
  products: any[];
  profiles: any[];
  coupons: any[];
  orderItems: any[];
  expenses: any[];
  manualSales: any[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData>({
    orders: [], products: [], profiles: [], coupons: [], orderItems: [], expenses: [], manualSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "7d" | "30d" | "year">("30d");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [orders, products, profiles, coupons, orderItems, expenses, manualSales] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*"),
        supabase.from("profiles").select("*"),
        supabase.from("coupons").select("*"),
        supabase.from("order_items").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("manual_sales").select("*"),
      ]);
      setData({
        orders: orders.data ?? [],
        products: products.data ?? [],
        profiles: profiles.data ?? [],
        coupons: coupons.data ?? [],
        orderItems: orderItems.data ?? [],
        expenses: expenses.data ?? [],
        manualSales: manualSales.data ?? [],
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  const cutoff = useMemo(() => {
    const now = new Date();
    if (period === "today") { now.setHours(0, 0, 0, 0); return now; }
    if (period === "7d") { now.setDate(now.getDate() - 7); return now; }
    if (period === "30d") { now.setDate(now.getDate() - 30); return now; }
    now.setFullYear(now.getFullYear() - 1);
    return now;
  }, [period]);

  const filtered = useMemo(() => {
    const orders = data.orders.filter(o => new Date(o.created_at) >= cutoff);
    const paidOrders = orders.filter(o => o.payment_status === "paid");
    const expenses = data.expenses.filter(e => new Date(e.expense_date) >= cutoff);
    const sales = data.manualSales.filter(s => new Date(s.sale_date) >= cutoff);
    const newCustomers = data.profiles.filter(p => new Date(p.created_at) >= cutoff);
    return { orders, paidOrders, expenses, sales, newCustomers };
  }, [data, cutoff]);

  // Revenue
  const onlineRevenue = filtered.paidOrders.reduce((s, o) => s + Number(o.total), 0);
  const manualRevenue = filtered.sales.reduce((s, o) => s + Number(o.amount), 0);
  const totalRevenue = onlineRevenue + manualRevenue;
  const totalExpenses = filtered.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const profit = totalRevenue - totalExpenses;

  // Previous period comparison
  const prevCutoff = useMemo(() => {
    const diff = Date.now() - cutoff.getTime();
    return new Date(cutoff.getTime() - diff);
  }, [cutoff]);

  const prevPaidOrders = data.orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= prevCutoff && d < cutoff && o.payment_status === "paid";
  });
  const prevRevenue = prevPaidOrders.reduce((s, o) => s + Number(o.total), 0);
  const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  // Top products
  const topProducts = useMemo(() => {
    const paidOrderIds = new Set(filtered.paidOrders.map(o => o.id));
    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    data.orderItems.filter(i => paidOrderIds.has(i.order_id)).forEach(item => {
      const key = item.product_name;
      if (!itemMap[key]) itemMap[key] = { name: key, qty: 0, revenue: 0 };
      itemMap[key].qty += item.quantity;
      itemMap[key].revenue += Number(item.unit_price) * item.quantity;
    });
    return Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filtered.paidOrders, data.orderItems]);

  // Low stock
  const lowStock = useMemo(() =>
    data.products.filter(p => p.is_active && p.stock_quantity <= 5).sort((a, b) => a.stock_quantity - b.stock_quantity).slice(0, 5),
    [data.products]
  );

  // Most used coupons
  const topCoupons = useMemo(() =>
    [...data.coupons].filter(c => c.current_uses > 0).sort((a, b) => b.current_uses - a.current_uses).slice(0, 5),
    [data.coupons]
  );

  // Revenue chart (daily)
  const revenueChart = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.paidOrders.forEach(o => {
      const day = new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map[day] = (map[day] || 0) + Number(o.total);
    });
    filtered.sales.forEach(s => {
      const day = new Date(s.sale_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      map[day] = (map[day] || 0) + Number(s.amount);
    });
    return Object.entries(map).map(([date, value]) => ({ date, value })).slice(-14);
  }, [filtered]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.orders.forEach(o => {
      const label = STATUS_LABELS[o.status] || o.status;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered.orders]);

  // Shipping stats
  const shippingStats = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.paidOrders.forEach(o => {
      if (o.shipping_service) {
        const key = `${o.shipping_carrier || ""} ${o.shipping_service}`.trim();
        map[key] = (map[key] || 0) + 1;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered.paidOrders]);

  // Conversion rate
  const conversionRate = data.profiles.length > 0
    ? ((data.orders.filter(o => o.payment_status === "paid").length / data.profiles.length) * 100)
    : 0;

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const fmtShort = (v: number) => {
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace(".", ",")}k`;
    return fmt(v);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        <div className="flex gap-1.5 bg-muted rounded-lg p-1">
          {([["today", "Hoje"], ["7d", "7d"], ["30d", "30d"], ["year", "Ano"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={DollarSign} iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600"
          label="Faturamento" value={fmtShort(totalRevenue)}
          change={revenueChange} subtitle={`Site: ${fmtShort(onlineRevenue)} · Ext: ${fmtShort(manualRevenue)}`}
        />
        <KpiCard
          icon={ShoppingCart} iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600"
          label="Pedidos" value={String(filtered.orders.length)}
          subtitle={`${filtered.paidOrders.length} pago(s)`}
        />
        <KpiCard
          icon={Users} iconBg="bg-violet-100 dark:bg-violet-900/30" iconColor="text-violet-600"
          label="Novos Clientes" value={String(filtered.newCustomers.length)}
          subtitle={`${data.profiles.length} total`}
        />
        <KpiCard
          icon={TrendingUp} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600"
          label="Ticket Médio" value={filtered.paidOrders.length > 0 ? fmtShort(onlineRevenue / filtered.paidOrders.length) : "R$ 0"}
          subtitle="por pedido pago"
        />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={TrendingDown} iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-600"
          label="Despesas" value={fmtShort(totalExpenses)}
        />
        <KpiCard
          icon={BarChart3} iconBg={profit >= 0 ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"}
          iconColor={profit >= 0 ? "text-emerald-600" : "text-red-600"}
          label="Lucro" value={fmtShort(profit)}
        />
        <KpiCard
          icon={Star} iconBg="bg-orange-100 dark:bg-orange-900/30" iconColor="text-orange-600"
          label="Taxa Conversão" value={`${conversionRate.toFixed(1)}%`}
          subtitle="clientes → compra"
        />
        <KpiCard
          icon={Package} iconBg="bg-rose-100 dark:bg-rose-900/30" iconColor="text-rose-600"
          label="Estoque Baixo" value={String(lowStock.length)}
          subtitle="≤ 5 unidades"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Faturamento Diário</h3>
          {revenueChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} labelStyle={{ color: "hsl(var(--foreground))" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Receita" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados no período</p>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-heading font-semibold text-sm mb-4">Pedidos por Status</h3>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={2}>
                  {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Sem dados</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {ordersByStatus.map((s, i) => (
              <span key={s.name} className="text-[10px] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {s.name}: {s.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Products */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Mais Vendidos
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Sem vendas no período</p>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.qty} un · {fmt(p.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
          <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Estoque Baixo
          </h3>
          {lowStock.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Tudo abastecido 👍</p>
          ) : (
            <div className="space-y-2.5">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between">
                  <p className="text-xs font-medium truncate flex-1">{p.name}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    p.stock_quantity === 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                  }`}>
                    {p.stock_quantity} un
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Coupons + Shipping */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-5">
          <div>
            <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-500" /> Cupons Mais Usados
            </h3>
            {topCoupons.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Nenhum cupom usado</p>
            ) : (
              <div className="space-y-1.5">
                {topCoupons.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="font-mono font-medium">{c.code}</span>
                    <span className="text-muted-foreground">{c.current_uses}x</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" /> Fretes Mais Usados
            </h3>
            {shippingStats.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Sem dados</p>
            ) : (
              <div className="space-y-1.5">
                {shippingStats.map(([label, count]) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="truncate flex-1">{label}</span>
                    <span className="text-muted-foreground">{count}x</span>
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

// Sub-component
function KpiCard({ icon: Icon, iconBg, iconColor, label, value, subtitle, change }: {
  icon: React.ElementType; iconBg: string; iconColor: string; label: string; value: string;
  subtitle?: string; change?: number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 sm:p-2 rounded-lg ${iconBg}`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{label}</p>
      </div>
      <p className="text-lg sm:text-xl font-bold">{value}</p>
      <div className="flex items-center gap-1 mt-0.5">
        {change !== undefined && change !== 0 && (
          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${change > 0 ? "text-emerald-600" : "text-red-600"}`}>
            {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change).toFixed(0)}%
          </span>
        )}
        {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  processing: "Em produção",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};
