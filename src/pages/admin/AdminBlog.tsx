import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  cover_image: string | null;
  author_name: string;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function AdminBlog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({
    title: "", slug: "", content: "", excerpt: "", cover_image: "",
    author_name: "Case Lab", meta_title: "", meta_description: "",
    tags: "", is_published: false,
  });

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", slug: "", content: "", excerpt: "", cover_image: "", author_name: "Case Lab", meta_title: "", meta_description: "", tags: "", is_published: false });
    setShowForm(true);
  };

  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug, content: p.content,
      excerpt: p.excerpt ?? "", cover_image: p.cover_image ?? "",
      author_name: p.author_name, meta_title: p.meta_title ?? "",
      meta_description: p.meta_description ?? "",
      tags: (p.tags ?? []).join(", "), is_published: p.is_published,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { toast.error("Título e conteúdo são obrigatórios"); return; }

    const slug = form.slug.trim() || generateSlug(form.title);
    const payload = {
      title: form.title.trim(),
      slug,
      content: form.content,
      excerpt: form.excerpt.trim() || null,
      cover_image: form.cover_image.trim() || null,
      author_name: form.author_name.trim() || "Case Lab",
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      is_published: form.is_published,
      published_at: form.is_published ? new Date().toISOString() : null,
      created_by: user!.id,
    };

    if (editing) {
      const { error } = await supabase.from("blog_posts").update(payload as any).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Post atualizado!");
    } else {
      const { error } = await supabase.from("blog_posts").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Post criado!");
    }
    setShowForm(false);
    fetchPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este post?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    toast.success("Post excluído!");
    fetchPosts();
  };

  const togglePublish = async (post: BlogPost) => {
    const is_published = !post.is_published;
    await supabase.from("blog_posts").update({
      is_published,
      published_at: is_published ? new Date().toISOString() : null,
    } as any).eq("id", post.id);
    toast.success(is_published ? "Post publicado!" : "Post despublicado");
    fetchPosts();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Blog</h1>
          <p className="text-xs text-muted-foreground">{posts.length} post(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> Novo Post</button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
          <h2 className="font-heading font-bold text-lg mb-4">{editing ? "Editar Post" : "Novo Post"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input type="text" value={form.title} onChange={(e) => {
                  setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) });
                }} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm" placeholder="auto-gerado" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Conteúdo *</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm min-h-[200px]" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Resumo</label>
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm min-h-[60px]" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL da imagem de capa</label>
                <input type="text" value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tags (separadas por vírgula)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm" placeholder="garrafa, brinde, academia" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Autor</label>
                <input type="text" value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm pb-3">
                  <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="rounded" />
                  Publicar agora
                </label>
              </div>
            </div>

            {/* SEO */}
            <div className="border border-border rounded-xl p-4 bg-muted/30">
              <h3 className="text-sm font-bold mb-3">🔍 SEO</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meta Title</label>
                  <input type="text" maxLength={60} value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meta Description</label>
                  <textarea maxLength={160} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm min-h-[40px]" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">Salvar</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum post ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              {post.cover_image && <img src={post.cover_image} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{post.title}</p>
                <p className="text-xs text-muted-foreground">/{post.slug} · {new Date(post.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${post.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {post.is_published ? "Publicado" : "Rascunho"}
              </span>
              <div className="flex gap-1.5">
                <button onClick={() => togglePublish(post)} className="p-1.5 rounded-lg hover:bg-muted" title={post.is_published ? "Despublicar" : "Publicar"}>
                  {post.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(post)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(post.id)} className="p-1.5 rounded-lg hover:bg-muted text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
