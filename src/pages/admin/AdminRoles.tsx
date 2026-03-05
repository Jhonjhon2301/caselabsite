import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Position {
  id: string;
  name: string;
  label: string;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Produtos" },
  { key: "stock", label: "Estoque" },
  { key: "internal_stock", label: "Estoque Interno" },
  { key: "orders", label: "Pedidos" },
  { key: "financial", label: "Financeiro" },
  { key: "coupons", label: "Cupons" },
  { key: "categories", label: "Categorias" },
  { key: "documents", label: "Documentos" },
  { key: "banner", label: "Banner" },
  { key: "payments", label: "Pagamentos" },
  { key: "reminders", label: "Lembretes" },
  { key: "notes", label: "Notas" },
  { key: "team", label: "Equipe" },
  { key: "designer", label: "Designer Drive" },
  { key: "roles", label: "Cargos" },
  { key: "fiscal", label: "Notas Fiscais" },
  { key: "customers", label: "Clientes" },
  { key: "blog", label: "Blog" },
  { key: "reviews", label: "Avaliações" },
  { key: "bi", label: "BI Avançado" },
  { key: "production", label: "Produção" },
  { key: "b2b", label: "B2B" },
  { key: "dre", label: "DRE" },
  { key: "audit", label: "Auditoria" },
  { key: "leads", label: "Leads" },
  { key: "docs", label: "Documentação" },
  { key: "proposals", label: "Propostas" },
];

export default function AdminRoles() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [form, setForm] = useState({ name: "", label: "", permissions: [] as string[] });

  const fetchPositions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("custom_positions")
      .select("*")
      .order("created_at");
    setPositions((data as Position[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPositions(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", label: "", permissions: [] });
    setDialogOpen(true);
  };

  const openEdit = (p: Position) => {
    setEditing(p);
    setForm({ name: p.name, label: p.label, permissions: [...p.permissions] });
    setDialogOpen(true);
  };

  const togglePerm = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const selectAll = () => {
    setForm((prev) => ({ ...prev, permissions: ALL_PERMISSIONS.map((p) => p.key) }));
  };

  const savePosition = async () => {
    if (!form.name.trim() || !form.label.trim()) {
      toast.error("Preencha nome e rótulo");
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("custom_positions")
        .update({ label: form.label, permissions: form.permissions })
        .eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Cargo atualizado!");
    } else {
      const { error } = await supabase.from("custom_positions").insert({
        name: form.name.toLowerCase().replace(/\s+/g, "_"),
        label: form.label,
        permissions: form.permissions,
      });
      if (error) {
        if (error.code === "23505") toast.error("Já existe um cargo com esse nome");
        else toast.error("Erro ao criar cargo");
        return;
      }
      toast.success("Cargo criado!");
    }

    setDialogOpen(false);
    fetchPositions();
  };

  const deletePosition = async (p: Position) => {
    if (p.name === "ceo") { toast.error("Não é possível excluir o cargo CEO"); return; }
    if (!confirm(`Excluir o cargo "${p.label}"?`)) return;
    const { error } = await supabase.from("custom_positions").delete().eq("id", p.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Cargo excluído");
    fetchPositions();
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Cargos e Permissões</h1>
          <p className="text-sm text-muted-foreground">Crie cargos e defina o que cada um pode acessar</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Novo Cargo
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : positions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Nenhum cargo cadastrado</p>
          </div>
        ) : (
          positions.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">{p.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {p.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {p.permissions.length === 0 ? (
                    <span className="text-xs text-muted-foreground">Sem permissões</span>
                  ) : (
                    p.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
                      >
                        {ALL_PERMISSIONS.find((ap) => ap.key === perm)?.label || perm}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="p-2 hover:bg-muted rounded-lg">
                  <Pencil className="w-4 h-4" />
                </button>
                {p.name !== "ceo" && (
                  <button onClick={() => deletePosition(p)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div>
                <Label>Nome interno (sem espaços)</Label>
                <Input
                  placeholder="ex: designer_senior"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label>Rótulo</Label>
              <Input
                placeholder="ex: Designer Sênior"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Permissões</Label>
                <button onClick={selectAll} className="text-xs text-primary hover:underline">
                  Selecionar tudo
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={form.permissions.includes(perm.key)}
                      onCheckedChange={() => togglePerm(perm.key)}
                    />
                    {perm.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={savePosition}>
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
