import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Shield, Pencil, Trash2, Plus, Search } from "lucide-react";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  position: string | null;
  email: string | null;
  full_name: string | null;
}

interface PositionOption {
  value: string;
  label: string;
}

export default function AdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState("");

  // Add member states
  const [showAdd, setShowAdd] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [newPosition, setNewPosition] = useState("ceo");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    supabase.from("custom_positions").select("name, label").order("created_at").then(({ data }) => {
      setPositions((data ?? []).map((p: any) => ({ value: p.name, label: p.label })));
    });
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("id, user_id, role, position")
      .eq("role", "admin");

    if (!roles?.length) { setMembers([]); setLoading(false); return; }

    const userIds = roles.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    setMembers(roles.map((r: any) => ({
      ...r,
      email: profileMap.get(r.user_id)?.email ?? null,
      full_name: profileMap.get(r.user_id)?.full_name ?? null,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const savePosition = async (id: string) => {
    const { error } = await supabase.from("user_roles").update({ position: editPosition }).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success("Cargo atualizado!");
    setEditingId(null);
    fetchMembers();
  };

  const removeAdmin = async (id: string) => {
    if (!confirm("Remover acesso admin deste usuário?")) return;
    const { error } = await supabase.from("user_roles").update({ role: "user" as any, position: null }).eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Acesso removido");
    fetchMembers();
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .ilike("email", `%${searchEmail.trim()}%`)
      .limit(10);

    // Filter out users that are already admins
    const adminIds = new Set(members.map(m => m.user_id));
    setSearchResults((data ?? []).filter((p: any) => !adminIds.has(p.user_id)));
    setSearching(false);
  };

  const addMember = async (userId: string) => {
    setAdding(true);
    // Update existing user_role to admin
    const { error } = await supabase
      .from("user_roles")
      .update({ role: "admin" as any, position: newPosition })
      .eq("user_id", userId);

    if (error) {
      toast.error("Erro ao adicionar: " + error.message);
      setAdding(false);
      return;
    }

    toast.success("Membro adicionado à equipe!");
    setShowAdd(false);
    setSearchEmail("");
    setSearchResults([]);
    setAdding(false);
    fetchMembers();
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Equipe</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie cargos e permissões da equipe admin</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> Adicionar Membro
        </button>
      </div>

      {/* Add member panel */}
      {showAdd && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
          <h2 className="font-semibold text-base mb-4">Adicionar Membro à Equipe</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Busque pelo e-mail do usuário cadastrado para promovê-lo a admin.
          </p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Buscar por e-mail..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchUsers()}
              className="flex-1 px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
            />
            <button
              onClick={searchUsers}
              disabled={searching}
              className="px-4 py-2.5 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Cargo</label>
            <select
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              className="px-3 py-2 rounded-lg border border-input bg-background text-sm w-full sm:w-auto"
            >
              {positions.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {searchResults.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              {searchResults.map((user: any) => (
                <div key={user.user_id} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{user.full_name || "Sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <button
                    onClick={() => addMember(user.user_id)}
                    disabled={adding}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                  >
                    {adding ? "..." : "Adicionar"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchEmail && !searching && (
            <p className="text-xs text-muted-foreground">Nenhum usuário encontrado. Verifique se o e-mail está correto e se o usuário já tem cadastro.</p>
          )}
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="grid grid-cols-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Membro</span><span>E-mail</span><span>Cargo</span><span>Ações</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Nenhum membro admin</p>
          </div>
        ) : (
          members.map((m) => (
            <div key={m.id} className="grid grid-cols-4 items-center p-4 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium truncate">{m.full_name || "—"}</span>
              </div>
              <span className="text-sm text-muted-foreground truncate">{m.email || "—"}</span>
              <div>
                {editingId === m.id ? (
                  <div className="flex gap-2">
                    <select value={editPosition} onChange={(e) => setEditPosition(e.target.value)} className="px-2 py-1 rounded border border-input bg-background text-sm">
                      {positions.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <button onClick={() => savePosition(m.id)} className="text-xs bg-primary text-primary-foreground py-1 px-3 rounded">Salvar</button>
                  </div>
                ) : (
                  <span className="text-sm capitalize">{positions.find((p) => p.value === m.position)?.label.split("—")[0] || m.position || "CEO"}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditingId(m.id); setEditPosition(m.position || "ceo"); }} className="p-2 hover:bg-muted rounded-lg"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => removeAdmin(m.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
