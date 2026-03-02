import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, TrendingDown, Calendar, ArrowRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line
} from "recharts";

export default function AdminDRE() {
  const [orders, setOrders] = useState<any[]>([]);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<any[]>([]);
  const [manualSales, setManualSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [o, oi, p, e, fe, ms] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("order_items").select("*"),
        supabase.from("products").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("fixed_expenses").select("*").eq("is_active", true),
        supabase.from("manual_sales").select("*"),
      ]);
      setOrders(o.data ?? []);
      setOrderItems(oi.data ?? []);
      setProducts(p.data ?? []);
      setExpenses(e.data ?? []);
      setFixedExpenses(fe.data ?? []);
      setManualSales(ms.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const paidOrders = useMemo(() => orders.filter(o => o.payment_status === "paid"), [orders]);

  // Build monthly DRE for last 6 months
  const dreMonths = useMemo(() => {
    const months: { key: string; label: string; start: Date; end: Date }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        start, end
      });
    }

    return months.map(m => {
      const mOrders = paidOrders.filter(o => {
        const d = new Date(o.created_at);
        return d >= m.start && d <= m.end;
      });
      const mSales = manualSales.filter(s => {
        const d = new Date(s.sale_date);
        return d >= m.start && d <= m.end;
      });
      const mExpenses = expenses.filter(e => {
        const d = new Date(e.expense_date);
        return d >= m.start && d <= m.end;
      });

      const revenueOnline = mOrders.reduce((s, o) => s + Number(o.total), 0);
      const revenueManual = mSales.reduce((s, o) => s + Number(o.amount), 0);
      const grossRevenue = revenueOnline + revenueManual;

      // CMV (Cost of goods sold)
      const paidIds = new Set(mOrders.map(o => o.id));
      const soldItems = orderItems.filter(i => paidIds.has(i.order_id));
      const cmv = soldItems.reduce((s, item) => {
        const prod = products.find(p => p.id === item.product_id);
        return s + (prod ? Number(prod.purchase_cost) : 0) * item.quantity;
      }, 0);

      const grossMargin = grossRevenue - cmv;

      // Shipping subsidized (difference between original and charged)
      const shippingSubsidy = mOrders.reduce((s, o) => {
        const orig = Number(o.shipping_original_cost || 0);
        const charged = Number(o.shipping_cost || 0);
        return s + Math.max(0, orig - charged);
      }, 0);

      // Gateway fees (~3.49% Stripe)
      const gatewayFees = revenueOnline * 0.0349;

      const operationalExpenses = mExpenses.reduce((s, e) => s + Number(e.amount), 0);
      const fixedMonthly = fixedExpenses.reduce((s, f) => s + Number(f.amount), 0);
      
      const totalExpenses = operationalExpenses + fixedMonthly + shippingSubsidy + gatewayFees;
      const netProfit = grossMargin - totalExpenses + cmv - cmv; // grossRevenue - cmv - totalExpenses
      const netProfitReal = grossRevenue - cmv - totalExpenses;
      const netMarginPct = grossRevenue > 0 ? (netProfitReal / grossRevenue) * 100 : 0;

      return {
        ...m,
        grossRevenue,
        revenueOnline,
        revenueManual,
        cmv,
        grossMargin,
        shippingSubsidy,
        gatewayFees,
        operationalExpenses,
        fixedMonthly,
        totalExpenses,
        netProfit: netProfitReal,
        netMarginPct,
      };
    });
  }, [paidOrders, manualSales, expenses, fixedExpenses, orderItems, products]);

  // Cash projection 30/60/90
  const cashProjection = useMemo(() => {
    const last3 = dreMonths.slice(-3);
    const avgRevenue = last3.reduce((s, m) => s + m.grossRevenue, 0) / Math.max(last3.length, 1);
    const avgExpenses = last3.reduce((s, m) => s + m.totalExpenses + m.cmv, 0) / Math.max(last3.length, 1);
    const avgProfit = avgRevenue - avgExpenses;

    let cum = 0;
    return [30, 60, 90].map(days => {
      const months = days / 30;
      cum = avgProfit * months;
      return { days: `${days} dias`, projected: cum, revenue: avgRevenue * months, expenses: avgExpenses * months };
    });
  }, [dreMonths]);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const currentMonth = dreMonths[dreMonths.length - 1];

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
          <DollarSign className="w-6 h-6 text-primary" /> DRE — Demonstrativo de Resultados
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Receita – CMV – Despesas – Lucro Líquido (últimos 6 meses)</p>
      </div>

      {/* Current month KPIs */}
      {currentMonth && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Receita Bruta</p>
            <p className="text-lg font-bold text-emerald-600">{fmt(currentMonth.grossRevenue)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">CMV</p>
            <p className="text-lg font-bold text-orange-600">{fmt(currentMonth.cmv)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Margem Bruta</p>
            <p className="text-lg font-bold">{fmt(currentMonth.grossMargin)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Despesas Totais</p>
            <p className="text-lg font-bold text-red-600">{fmt(currentMonth.totalExpenses)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">Lucro Líquido</p>
            <p className={`text-lg font-bold ${currentMonth.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(currentMonth.netProfit)}</p>
            <p className="text-[10px] text-muted-foreground">Margem: {currentMonth.netMarginPct.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* Revenue vs Profit chart */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h3 className="font-heading font-semibold text-sm mb-4">Evolução Mensal — Receita vs Lucro</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dreMonths}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="grossRevenue" fill="hsl(var(--primary))" name="Receita" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netProfit" fill="#10b981" name="Lucro Líquido" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* DRE Table */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h3 className="font-heading font-semibold text-sm mb-4">DRE Comparativa</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Linha</th>
                {dreMonths.map(m => (
                  <th key={m.key} className="text-right px-3 py-2 font-medium text-muted-foreground">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Receita Bruta", key: "grossRevenue", bold: true, color: "text-emerald-600" },
                { label: "  Vendas Online", key: "revenueOnline" },
                { label: "  Vendas Externas", key: "revenueManual" },
                { label: "(-) CMV", key: "cmv", color: "text-orange-600" },
                { label: "= Margem Bruta", key: "grossMargin", bold: true },
                { label: "(-) Gateway (3.49%)", key: "gatewayFees", color: "text-red-500" },
                { label: "(-) Frete Subsidiado", key: "shippingSubsidy", color: "text-red-500" },
                { label: "(-) Despesas Operacionais", key: "operationalExpenses", color: "text-red-600" },
                { label: "(-) Gastos Fixos", key: "fixedMonthly", color: "text-red-600" },
                { label: "= Lucro Líquido", key: "netProfit", bold: true, color: "" },
                { label: "Margem Líquida %", key: "netMarginPct", pct: true },
              ].map(row => (
                <tr key={row.label} className={`border-b border-border last:border-0 ${row.bold ? "bg-muted/30" : ""}`}>
                  <td className={`px-3 py-2 ${row.bold ? "font-bold" : "text-muted-foreground"} whitespace-nowrap`}>{row.label}</td>
                  {dreMonths.map(m => {
                    const val = (m as any)[row.key];
                    const isNeg = row.key === "netProfit" && val < 0;
                    return (
                      <td key={m.key} className={`px-3 py-2 text-right ${row.bold ? "font-bold" : ""} ${isNeg ? "text-red-600" : (row.color || "")} ${row.key === "netProfit" && val >= 0 ? "text-emerald-600" : ""}`}>
                        {(row as any).pct ? `${val.toFixed(1)}%` : fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash projection */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <h3 className="font-heading font-semibold text-sm mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Projeção de Caixa (30 / 60 / 90 dias)
        </h3>
        <p className="text-xs text-muted-foreground mb-4">Baseado na média dos últimos 3 meses</p>
        <div className="grid grid-cols-3 gap-3">
          {cashProjection.map(cp => (
            <div key={cp.days} className="text-center p-4 rounded-xl border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">{cp.days}</p>
              <p className={`text-lg font-bold ${cp.projected >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(cp.projected)}</p>
              <div className="flex justify-center gap-2 mt-2 text-[10px] text-muted-foreground">
                <span className="text-emerald-500">↑ {fmt(cp.revenue)}</span>
                <span className="text-red-500">↓ {fmt(cp.expenses)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
