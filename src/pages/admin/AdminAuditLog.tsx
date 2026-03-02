import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Search, RefreshCw } from "lucide-react";

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const entityTypes = [...new Set(logs.map(l => l.entity_type))].sort();

  const filtered = logs.filter(l => {
    if (entityFilter && l.entity_type !== entityFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.action?.toLowerCase().includes(s) ||
        l.entity_type?.toLowerCase().includes(s) ||
        l.user_email?.toLowerCase().includes(s) ||
        JSON.stringify(l.details)?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const actionColor = (action: string) => {
    if (action.includes("create") || action.includes("insert")) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30";
    if (action.includes("update") || action.includes("edit")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30";
    if (action.includes("delete") || action.includes("remove")) return "bg-red-100 text-red-700 dark:bg-red-900/30";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Log de Auditoria
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Registro de todas as ações administrativas</p>
        </div>
        <button onClick={fetchLogs} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar ação, usuário, detalhes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
        >
          <option value="">Todas entidades</option>
          {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Log table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data/Hora</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ação</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entidade</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado</td></tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-xs truncate max-w-[160px]">{log.user_email || log.user_id?.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">{log.entity_type}{log.entity_id ? ` #${log.entity_id.slice(0, 8)}` : ""}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[300px] truncate">
                      {log.details && Object.keys(log.details).length > 0 ? JSON.stringify(log.details) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
