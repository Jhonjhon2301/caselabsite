import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Palette, Plus, Trash2, Loader2, Package, Check } from "lucide-react";

interface ArtTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  preview_url: string;
  pdf_url: string | null;
  is_active: boolean;
  product_ids: string[];
  created_at: string;
}

interface SimpleProduct {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
}

export default function AdminArtTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [arts, setArts] = useState<ArtTemplate[]>([]);
  const [products, setProducts] = useState<SimpleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "" });
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [editingProducts, setEditingProducts] = useState<string | null>(null);
  const [editProductIds, setEditProductIds] = useState<string[]>([]);
  const [editingInfo, setEditingInfo] = useState<string | null>(null);
  const [editInfo, setEditInfo] = useState({ name: "", description: "", category: "" });

  const fetchData = async () => {
    const [{ data: artsData }, { data: prodsData }] = await Promise.all([
      supabase.from("art_templates").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id, name, price, images").eq("is_active", true).order("name"),
    ]);
    setArts((artsData as ArtTemplate[]) ?? []);
    setProducts((prodsData as SimpleProduct[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleProduct = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleUpload = async () => {
    if (!form.name || !previewFile || !user) {
      toast({ title: "Preencha o nome e envie a imagem de preview", variant: "destructive" });
      return;
    }
    if (selectedProductIds.length === 0) {
      toast({ title: "Selecione pelo menos um modelo de garrafa", variant: "destructive" });
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
        product_ids: selectedProductIds,
        created_by: user.id,
      } as any);

      toast({ title: "Arte adicionada com sucesso!" });
      setForm({ name: "", description: "", category: "" });
      setPreviewFile(null);
      setPdfFile(null);
      setSelectedProductIds([]);
      fetchData();
    } catch {
      toast({ title: "Erro ao enviar", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta arte?")) return;
    await supabase.from("art_templates").delete().eq("id", id);
    toast({ title: "Arte removida" });
    fetchData();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("art_templates").update({ is_active: !current }).eq("id", id);
    fetchData();
  };

  const startEditProducts = (art: ArtTemplate) => {
    setEditingProducts(art.id);
    setEditProductIds([...(art.product_ids || [])]);
  };

  const saveEditProducts = async () => {
    if (!editingProducts) return;
    await supabase.from("art_templates").update({ product_ids: editProductIds } as any).eq("id", editingProducts);
    toast({ title: "Modelos atualizados!" });
    setEditingProducts(null);
    fetchData();
  };

  const startEditInfo = (art: ArtTemplate) => {
    setEditingInfo(art.id);
    setEditInfo({ name: art.name, description: art.description || "", category: art.category || "" });
  };

  const saveEditInfo = async () => {
    if (!editingInfo) return;
    await supabase.from("art_templates").update({
      name: editInfo.name,
      description: editInfo.description || null,
      category: editInfo.category || null,
    } as any).eq("id", editingInfo);
    toast({ title: "Informações atualizadas!" });
    setEditingInfo(null);
    fetchData();
  };

  const getProductName = (id: string) => products.find((p) => p.id === id)?.name || id.slice(0, 8);

  const ProductSelector = ({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto">
      {products.map((p) => {
        const isSelected = selected.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onToggle(p.id)}
            className={`flex items-center gap-2 p-2 rounded-lg border-2 text-left transition-all ${
              isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            }`}
          >
            <img
              src={p.images?.[0] || "/placeholder.svg"}
              alt={p.name}
              className="w-10 h-10 rounded-md object-cover bg-muted shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">
                R$ {p.price.toFixed(2)}
              </p>
            </div>
            {isSelected && (
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-heading font-black text-xl sm:text-2xl mb-6 flex items-center gap-2">
        <Palette className="w-6 h-6 text-primary" />
        Catálogo de Artes
      </h1>

      {/* Add form */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
        <h2 className="font-bold text-sm">Adicionar Nova Arte</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nome da arte *"
          />
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Categoria (ex: Médico, Esporte)"
          />
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição (opcional)"
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

        {/* Product selector for new art */}
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-2 block flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            Modelos de Garrafa Disponíveis *
            {selectedProductIds.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {selectedProductIds.length}
              </span>
            )}
          </label>
          <ProductSelector
            selected={selectedProductIds}
            onToggle={(id) => toggleProduct(id, selectedProductIds, setSelectedProductIds)}
          />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {arts.map((art) => (
            <div key={art.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-video bg-muted relative">
                <img src={art.preview_url} alt={art.name} className="w-full h-full object-cover" />
                {!art.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Inativa</span>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{art.name}</p>
                    {art.category && <p className="text-xs text-muted-foreground">{art.category}</p>}
                  </div>
                </div>

                {/* Associated products */}
                {editingProducts === art.id ? (
                  <div className="space-y-2">
                    <ProductSelector
                      selected={editProductIds}
                      onToggle={(id) => toggleProduct(id, editProductIds, setEditProductIds)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 text-xs h-7" onClick={saveEditProducts}>
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setEditingProducts(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Package className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-bold">
                        {art.product_ids?.length || 0} modelo(s)
                      </span>
                    </div>
                    {art.product_ids?.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {art.product_ids.map((pid) => (
                          <span key={pid} className="bg-muted text-[10px] px-2 py-0.5 rounded-full truncate max-w-[150px]">
                            {getProductName(pid)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-destructive mb-2">Nenhum modelo associado</p>
                    )}
                    <Button size="sm" variant="outline" className="text-[10px] h-6 w-full" onClick={() => startEditProducts(art)}>
                      Editar Modelos
                    </Button>
                  </div>
                )}

                <div className="flex gap-1 pt-1 border-t border-border">
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
