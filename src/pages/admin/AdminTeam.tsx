import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Shield, Pencil, Trash2 } from "lucide-react";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  position: string | null;
  email: string | null;
  full_name: string | null;
}

const POSITIONS = [
  { value: "ceo", label: "CEO — Acesso total" },
  { value: "vendedor", label: "Vendedor — Produtos, Pedidos e Cupons" },
  { value: "financeiro", label: "Financeiro — Área financeira" },
];

export default function AdminTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState("");

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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">Equipe</h1>
        <p className="text-sm text-muted-foreground">Gerencie cargos e permissões da equipe admin</p>
      </div>

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
                      {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <button onClick={() => savePosition(m.id)} className="text-xs btn-primary py-1 px-3">Salvar</button>
                  </div>
                ) : (
                  <span className="text-sm capitalize">{POSITIONS.find((p) => p.value === m.position)?.label.split("—")[0] || m.position || "CEO"}</span>
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
