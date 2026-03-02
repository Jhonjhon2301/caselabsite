import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Download, Users } from "lucide-react";

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("lead_captures").select("*").order("created_at", { ascending: false }).limit(500)
      .then(({ data }) => { setLeads(data ?? []); setLoading(false); });
  }, []);

  const exportCSV = () => {
    const header = "Email,Nome,Telefone,Origem,Data\n";
    const rows = leads.map(l =>
      `"${l.email}","${l.name || ""}","${l.phone || ""}","${l.source || ""}","${new Date(l.created_at).toLocaleDateString("pt-BR")}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "leads-caselab.csv"; a.click();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" /> Leads Capturados
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{leads.length} leads coletados</p>
        </div>
        <button onClick={exportCSV} className="btn-primary text-xs flex items-center gap-2">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Telefone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Origem</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum lead capturado ainda</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{l.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{l.source}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
