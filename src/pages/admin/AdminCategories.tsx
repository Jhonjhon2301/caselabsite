import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Grid3X3 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", icon: "" });

  const fetchCategories = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", icon: "" }); setShowForm(true); };
  const openEdit = (c: Category) => { setEditing(c); setForm({ name: c.name, icon: c.icon ?? "" }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Informe o nome"); return; }
    const payload = { name: form.name.trim(), icon: form.icon.trim() || null };

    if (editing) {
      const { error } = await supabase.from("categories").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Categoria atualizada!");
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) { toast.error(error.message.includes("duplicate") ? "Categoria já existe" : "Erro ao criar"); return; }
      toast.success("Categoria criada!");
    }
    setShowForm(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast.success("Categoria excluída!");
    fetchCategories();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold">Categorias</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categoria(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Nova Categoria</button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ícone (emoji)</label>
                <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" placeholder="🏥" />
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((c) => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{c.icon ?? "📦"}</p>
              <p className="font-medium text-sm">{c.name}</p>
              <div className="flex justify-center gap-2 mt-3">
                <button onClick={() => openEdit(c)} className="p-2 hover:bg-muted rounded-lg"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
