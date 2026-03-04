import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Grid3X3, ChevronRight } from "lucide-react";
import { logAudit } from "@/lib/audit";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", icon: "", parent_id: "" });

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = (parentId?: string) => { setEditing(null); setForm({ name: "", icon: "", parent_id: parentId || "" }); setShowForm(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, icon: c.icon ?? "", parent_id: c.parent_id ?? "" }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Informe o nome"); return; }
    const payload = { name: form.name.trim(), icon: form.icon.trim() || null, parent_id: form.parent_id || null };

    if (editing) {
      const { error } = await supabase.from("categories").update(payload as any).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      await logAudit("update_category", "category", editing.id, { name: payload.name });
      toast.success("Categoria atualizada!");
    } else {
      const { data, error } = await supabase.from("categories").insert(payload as any).select().single();
      if (error) { toast.error(error.message.includes("duplicate") ? "Categoria já existe" : "Erro ao criar"); return; }
      await logAudit("create_category", "category", (data as any)?.id, { name: payload.name });
      toast.success("Categoria criada!");
    }
    setShowForm(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria? Subcategorias ficarão sem pai.")) return;
    await supabase.from("categories").delete().eq("id", id);
    await logAudit("delete_category", "category", id);
    toast.success("Categoria excluída!");
    fetchCategories();
  };

  // Separate parents (no parent_id) and children
  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categoria(s)</p>
        </div>
        <button onClick={() => openCreate()} className="btn-primary"><Plus className="w-4 h-4" /> Nova Categoria</button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ícone (emoji)</label>
                <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" placeholder="🏥" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria pai (opcional)</label>
                <select value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none">
                  <option value="">Nenhuma (é categoria principal)</option>
                  {parentCategories.filter(c => c.id !== editing?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.icon ?? "📦"} {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">{editing ? "Salvar" : "Criar"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p className="text-muted-foreground">Carregando...</p> : categories.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma categoria cadastrada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {parentCategories.map((parent) => {
            const children = getChildren(parent.id);
            return (
              <div key={parent.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{parent.icon ?? "📦"}</span>
                    <span className="font-bold text-sm">{parent.name}</span>
                    <span className="text-xs text-muted-foreground">({children.length} sub)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openCreate(parent.id)} className="p-2 hover:bg-muted rounded-lg text-primary" title="Adicionar subcategoria"><Plus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => openEdit(parent)} className="p-2 hover:bg-muted rounded-lg"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(parent.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-3">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs">{child.icon ?? "📦"}</span>
                          <span className="text-xs font-medium">{child.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(child)} className="p-1 hover:bg-muted rounded"><Pencil className="w-2.5 h-2.5" /></button>
                          <button onClick={() => handleDelete(child.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-2.5 h-2.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {/* Orphan categories (children whose parent was deleted) */}
          {categories.filter(c => c.parent_id && !parentCategories.find(p => p.id === c.parent_id)).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm font-bold mb-3 text-muted-foreground">Sem categoria pai</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.filter(c => c.parent_id && !parentCategories.find(p => p.id === c.parent_id)).map((c) => (
                  <div key={c.id} className="bg-muted/50 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-xs font-medium">{c.icon ?? "📦"} {c.name}</span>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="p-1 hover:bg-muted rounded"><Pencil className="w-2.5 h-2.5" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-2.5 h-2.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
