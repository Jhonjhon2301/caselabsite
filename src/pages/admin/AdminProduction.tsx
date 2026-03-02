import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Factory, Clock, User, AlertTriangle, CheckCircle, Palette, Package, Truck, Search } from "lucide-react";

const STATUSES = [
  { value: "waiting_art", label: "Aguardando Arte", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30", icon: Palette },
  { value: "art_approved", label: "Arte Aprovada", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30", icon: CheckCircle },
  { value: "in_production", label: "Em Produção", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30", icon: Factory },
  { value: "completed", label: "Pronto", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30", icon: Package },
  { value: "shipped", label: "Enviado", color: "bg-green-100 text-green-700 dark:bg-green-900/30", icon: Truck },
];

interface QueueItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  status: string;
  designer_name: string | null;
  customer_name: string | null;
  priority: number;
  notes: string | null;
  created_at: string;
  art_approved_at: string | null;
  production_started_at: string | null;
  production_completed_at: string | null;
  shipped_at: string | null;
}

export default function AdminProduction() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("production_queue")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) toast.error("Erro ao carregar fila");
    else setItems((data as QueueItem[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    const now = new Date().toISOString();
    if (newStatus === "art_approved") updates.art_approved_at = now;
    if (newStatus === "in_production") updates.production_started_at = now;
    if (newStatus === "completed") updates.production_completed_at = now;
    if (newStatus === "shipped") updates.shipped_at = now;

    const { error } = await supabase.from("production_queue").update(updates).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else {
      toast.success("Status atualizado");
      load();
    }
  };

  const updateDesigner = async (id: string, name: string) => {
    await supabase.from("production_queue").update({ designer_name: name }).eq("id", id);
    load();
  };

  const filtered = useMemo(() => {
    let list = items;
    if (filter !== "all") list = list.filter(i => i.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.product_name.toLowerCase().includes(q) || i.customer_name?.toLowerCase().includes(q));
    }
    return list;
  }, [items, filter, search]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const inProd = items.filter(i => i.status === "in_production").length;
    const waiting = items.filter(i => i.status === "waiting_art").length;
    const completed = items.filter(i => i.status === "completed" || i.status === "shipped").length;
    // Average production time (for completed items)
    const completedItems = items.filter(i => i.production_started_at && i.production_completed_at);
    let avgTime = 0;
    if (completedItems.length > 0) {
      const totalMs = completedItems.reduce((s, i) => {
        return s + (new Date(i.production_completed_at!).getTime() - new Date(i.production_started_at!).getTime());
      }, 0);
      avgTime = totalMs / completedItems.length / (1000 * 60 * 60); // hours
    }
    return { total, inProd, waiting, completed, avgTime };
  }, [items]);

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none";

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Factory className="w-6 h-6 text-primary" /> Sistema de Produção
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Fila de produção e controle de status</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Total na Fila</p>
          <p className="text-xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Aguardando Arte</p>
          <p className="text-xl font-bold text-amber-600">{stats.waiting}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Em Produção</p>
          <p className="text-xl font-bold text-violet-600">{stats.inProd}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Concluídos</p>
          <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground">Tempo Médio</p>
          <p className="text-xl font-bold">{stats.avgTime > 0 ? `${stats.avgTime.toFixed(1)}h` : "—"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Buscar produto ou cliente..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} />
        </div>
        <div className="flex gap-1.5 bg-muted rounded-lg p-1 overflow-x-auto">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${filter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            Todos
          </button>
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => setFilter(s.value)} className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${filter === s.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Factory className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum item na fila</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const status = STATUSES.find(s => s.value === item.status) || STATUSES[0];
            const StatusIcon = status.icon;
            const currentIdx = STATUSES.findIndex(s => s.value === item.status);
            const nextStatus = currentIdx < STATUSES.length - 1 ? STATUSES[currentIdx + 1] : null;

            return (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
                      <StatusIcon className="w-3 h-3" /> {status.label}
                    </span>
                    {item.priority > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 font-medium">
                        Prioridade {item.priority}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{item.product_name} × {item.quantity}</p>
                  <p className="text-xs text-muted-foreground">{item.customer_name || "Cliente"} · Pedido {item.order_id.slice(0, 8)}</p>
                  {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Designer..."
                    value={item.designer_name || ""}
                    onChange={e => updateDesigner(item.id, e.target.value)}
                    className="w-28 px-2 py-1.5 text-xs border border-input rounded-lg bg-background"
                  />
                  {nextStatus && (
                    <button
                      onClick={() => updateStatus(item.id, nextStatus.value)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
                    >
                      → {nextStatus.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
