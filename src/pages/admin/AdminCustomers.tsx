import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Download, Search, Check } from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
}

const ALL_COLUMNS = [
  { key: "full_name", label: "Nome" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
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

export default function AdminCustomers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCols, setSelectedCols] = useState<Set<ColKey>>(new Set(ALL_COLUMNS.map((c) => c.key)));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, email, phone, created_at")
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
        p.phone?.includes(q)
    );
  }, [profiles, search]);

  const toggleCol = (key: ColKey) => {
    setSelectedCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
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

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none";

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Clientes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {profiles.length} cadastros no total
          </p>
        </div>
      </div>

      {/* Search + Export */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <button
          onClick={downloadCsv}
          disabled={filtered.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>

      {/* Column selector */}
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="text-xs font-medium text-muted-foreground self-center mr-1">Colunas:</span>
        {ALL_COLUMNS.map((col) => {
          const active = selectedCols.has(col.key);
          return (
            <button
              key={col.key}
              onClick={() => toggleCol(col.key)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input text-muted-foreground hover:bg-accent"
              }`}
            >
              {active && <Check className="w-3 h-3" />}
              {col.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
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
                  <th key={col.key} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  {selectedCols.has("full_name") && (
                    <td className="px-4 py-3 font-medium">{p.full_name || "—"}</td>
                  )}
                  {selectedCols.has("email") && (
                    <td className="px-4 py-3 text-muted-foreground">{p.email || "—"}</td>
                  )}
                  {selectedCols.has("phone") && (
                    <td className="px-4 py-3 text-muted-foreground">{p.phone || "—"}</td>
                  )}
                  {selectedCols.has("created_at") && (
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
