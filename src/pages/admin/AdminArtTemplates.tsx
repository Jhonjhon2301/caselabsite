import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, Plus, Trash2, Loader2 } from "lucide-react";

interface ArtTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  preview_url: string;
  pdf_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AdminArtTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [arts, setArts] = useState<ArtTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const fetchArts = async () => {
    const { data } = await supabase.from("art_templates").select("*").order("created_at", { ascending: false });
    setArts((data as ArtTemplate[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchArts(); }, []);

  const handleUpload = async () => {
    if (!form.name || !previewFile || !user) {
      toast({ title: "Preencha o nome e envie a imagem de preview", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ts = Date.now();
      const previewPath = `previews/${ts}-${previewFile.name}`;
      await supabase.storage.from("art-templates").upload(previewPath, previewFile);
      const { data: { publicUrl: previewUrl } } = supabase.storage.from("art-templates").getPublicUrl(previewPath);

      let pdfUrl: string | null = null;
      if (pdfFile) {
        const pdfPath = `pdfs/${ts}-${pdfFile.name}`;
        await supabase.storage.from("art-templates").upload(pdfPath, pdfFile);
        const { data: { publicUrl } } = supabase.storage.from("art-templates").getPublicUrl(pdfPath);
        pdfUrl = publicUrl;
      }

      await supabase.from("art_templates").insert({
        name: form.name,
        description: form.description || null,
        category: form.category || null,
        preview_url: previewUrl,
        pdf_url: pdfUrl,
        created_by: user.id,
      });

      toast({ title: "Arte adicionada com sucesso!" });
      setForm({ name: "", description: "", category: "" });
      setPreviewFile(null);
      setPdfFile(null);
      fetchArts();
    } catch (err) {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta arte?")) return;
    await supabase.from("art_templates").delete().eq("id", id);
    toast({ title: "Arte removida" });
    fetchArts();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("art_templates").update({ is_active: !current }).eq("id", id);
    fetchArts();
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-heading font-black text-xl sm:text-2xl mb-6 flex items-center gap-2">
        <Palette className="w-6 h-6 text-primary" />
        Catálogo de Artes
      </h1>

      {/* Add form */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-3">
        <h2 className="font-bold text-sm">Adicionar Nova Arte</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome da arte *"
            className="bg-muted rounded-lg px-3 py-2 text-sm outline-none"
          />
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Categoria (ex: Médico, Esporte)"
            className="bg-muted rounded-lg px-3 py-2 text-sm outline-none"
          />
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição (opcional)"
            className="bg-muted rounded-lg px-3 py-2 text-sm outline-none"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Imagem Preview *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Arquivo PDF (opcional)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
          </div>
        </div>
        <Button onClick={handleUpload} disabled={uploading} className="gap-2">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Adicionar Arte
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : arts.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Nenhuma arte cadastrada</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {arts.map((art) => (
            <div key={art.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-square bg-muted relative">
                <img src={art.preview_url} alt={art.name} className="w-full h-full object-cover" />
                {!art.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Inativa</span>
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xs font-bold truncate">{art.name}</p>
                {art.category && <p className="text-[10px] text-muted-foreground">{art.category}</p>}
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={art.is_active ? "outline" : "default"}
                    className="flex-1 text-[10px] h-7"
                    onClick={() => toggleActive(art.id, art.is_active)}
                  >
                    {art.is_active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => handleDelete(art.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
