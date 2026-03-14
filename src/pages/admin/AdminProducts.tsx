import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, Package, Loader2, Image, Move } from "lucide-react";
import { logAudit } from "@/lib/audit";

interface ProductVariant {
  name: string;
  hex: string;
  price?: number;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: string[];
  category_id: string | null;
  is_active: boolean;
  is_customizable: boolean;
  stock_quantity: number;
  measurements: string | null;
  variants: ProductVariant[] | null;
  text_top: number | null;
  text_left: number | null;
  text_rotation: number | null;
  discount_percent: number;
  meta_title: string | null;
  meta_description: string | null;
  purchase_cost: number;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", category_id: "",
    is_active: true, is_customizable: false,
    text_top: "42", text_left: "50", text_rotation: "0", text_orientation: "horizontal",
    discount_percent: "0",
    meta_title: "", meta_description: "", purchase_cost: "0",
    production_days: "3",
    ncm: "00000000", cfop: "5102", cest: "", ean: "",
    unidade_comercial: "UND", origem_produto: "0",
    cod_situacao_tributaria_icms: "102",
    cod_situacao_tributaria_pis: "07",
    cod_situacao_tributaria_cofins: "07",
  });
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariant, setNewVariant] = useState({ name: "", hex: "#000000", price: "" });
  const [variantUploading, setVariantUploading] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    setProducts((prods as any[]) ?? []);
    setCategories((cats as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", category_id: "", is_active: true, is_customizable: false, text_top: "42", text_left: "50", text_rotation: "0", text_orientation: "horizontal", discount_percent: "0", meta_title: "", meta_description: "", purchase_cost: "0", production_days: "3", ncm: "00000000", cfop: "5102", cest: "", ean: "", unidade_comercial: "UND", origem_produto: "0", cod_situacao_tributaria_icms: "102", cod_situacao_tributaria_pis: "07", cod_situacao_tributaria_cofins: "07" });
    setImageUrls([]);
    setVariants([]);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    const pa = p as any;
    setForm({
      name: p.name, description: p.description ?? "", price: String(p.price),
      category_id: p.category_id ?? "", is_active: p.is_active, is_customizable: p.is_customizable,
      text_top: String(p.text_top ?? 42), text_left: String(p.text_left ?? 50), text_rotation: String(p.text_rotation ?? 0),
      text_orientation: pa.text_orientation ?? "horizontal",
      discount_percent: String(p.discount_percent ?? 0),
      meta_title: pa.meta_title ?? "", meta_description: pa.meta_description ?? "",
      purchase_cost: String(pa.purchase_cost ?? 0),
      production_days: String(pa.production_days ?? 3),
      ncm: pa.ncm ?? "00000000", cfop: String(pa.cfop ?? 5102), cest: pa.cest ?? "", ean: pa.ean ?? "",
      unidade_comercial: pa.unidade_comercial ?? "UND", origem_produto: String(pa.origem_produto ?? 0),
      cod_situacao_tributaria_icms: pa.cod_situacao_tributaria_icms ?? "102",
      cod_situacao_tributaria_pis: pa.cod_situacao_tributaria_pis ?? "07",
      cod_situacao_tributaria_cofins: pa.cod_situacao_tributaria_cofins ?? "07",
    });
    setImageUrls(p.images ?? []);
    setVariants((p.variants as ProductVariant[]) ?? []);
    setShowForm(true);
  };

  const [processingImages, setProcessingImages] = useState<Set<number>>(new Set());

  const processImageWithAI = async (originalUrl: string, index: number): Promise<string | null> => {
    try {
      setProcessingImages(prev => new Set(prev).add(index));
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-product-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageUrl: originalUrl }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        toast.error(err.error || "Erro ao processar imagem com IA");
        return null;
      }
      const { processedUrl } = await response.json();
      toast.success("Imagem processada com IA!");
      return processedUrl;
    } catch (err) {
      console.error("AI processing error:", err);
      toast.error("Erro ao processar imagem");
      return null;
    } finally {
      setProcessingImages(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast.error(`Erro ao enviar ${file.name}`); return null; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file);
      if (url) newUrls.push(url);
    }
    setImageUrls((prev) => [...prev, ...newUrls]);
    setUploading(false);

    const startIdx = imageUrls.length;
    for (let i = 0; i < newUrls.length; i++) {
      const processedUrl = await processImageWithAI(newUrls[i], startIdx + i);
      if (processedUrl) {
        setImageUrls(prev => {
          const updated = [...prev];
          updated[startIdx + i] = processedUrl;
          return updated;
        });
      }
    }
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVariantUploading(variantIdx);
    const url = await uploadFile(file);
    if (url) {
      setVariants(prev => {
        const updated = [...prev];
        updated[variantIdx] = { ...updated[variantIdx], image: url };
        return updated;
      });
      toast.success(`Imagem da variante "${variants[variantIdx].name}" enviada!`);
    }
    setVariantUploading(null);
  };

  const removeImage = (idx: number) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  const addVariant = () => {
    if (!newVariant.name.trim()) { toast.error("Informe o nome da cor"); return; }
    setVariants((prev) => [...prev, {
      name: newVariant.name.trim(),
      hex: newVariant.hex,
      price: newVariant.price ? parseFloat(newVariant.price) : undefined,
    }]);
    setNewVariant({ name: "", hex: "#000000", price: "" });
  };

  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) { toast.error("Preencha nome e preço"); return; }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price),
      category_id: form.category_id || null,
      is_active: form.is_active,
      is_customizable: form.is_customizable,
      images: imageUrls,
      variants: (variants.length > 0 ? variants : []) as any,
      text_top: form.is_customizable ? parseFloat(form.text_top) || 42 : null,
      text_left: form.is_customizable ? parseFloat(form.text_left) || 50 : null,
      text_rotation: form.is_customizable ? parseFloat(form.text_rotation) || 0 : null,
      text_orientation: form.is_customizable ? form.text_orientation : "horizontal",
      discount_percent: parseFloat(form.discount_percent) || 0,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || null,
      purchase_cost: parseFloat(form.purchase_cost) || 0,
      production_days: parseInt(form.production_days) || 3,
      ncm: form.ncm.trim() || "00000000",
      cfop: parseInt(form.cfop) || 5102,
      cest: form.cest.trim() || null,
      ean: form.ean.trim() || null,
      unidade_comercial: form.unidade_comercial || "UND",
      origem_produto: parseInt(form.origem_produto) || 0,
      cod_situacao_tributaria_icms: form.cod_situacao_tributaria_icms || "102",
      cod_situacao_tributaria_pis: form.cod_situacao_tributaria_pis || "07",
      cod_situacao_tributaria_cofins: form.cod_situacao_tributaria_cofins || "07",
    };

    if (editing) {
      const { error } = await supabase.from("products").update(payload as any).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      await logAudit("update_product", "product", editing.id, { name: payload.name, price: payload.price });
      toast.success("Produto atualizado!");
    } else {
      const { data, error } = await supabase.from("products").insert(payload as any).select().single();
      if (error) { toast.error("Erro ao criar"); return; }
      await logAudit("create_product", "product", (data as any)?.id, { name: payload.name, price: payload.price });
      toast.success("Produto criado!");
    }
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const p = products.find(pr => pr.id === id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    await logAudit("delete_product", "product", id, { name: p?.name });
    toast.success("Produto excluído!");
    fetchData();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-bold">Produtos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <button onClick={openCreate} className="btn-primary w-full sm:w-auto justify-center"><Plus className="w-4 h-4" /> Novo Produto</button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="font-heading font-bold text-lg mb-4">{editing ? "Editar Produto" : "Novo Produto"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preço (R$) *</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Desconto (%)</label>
                <input type="number" step="1" min="0" max="100" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" placeholder="0" />
                {parseFloat(form.discount_percent) > 0 && parseFloat(form.price) > 0 && (
                  <p className="text-xs text-primary mt-1 font-semibold">
                    De R$ {(parseFloat(form.price) / (1 - parseFloat(form.discount_percent) / 100)).toFixed(2)} por R$ {parseFloat(form.price).toFixed(2)} ({form.discount_percent}% OFF)
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none min-h-[80px]" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Custo de Compra (R$)</label>
              <input type="number" step="0.01" min="0" value={form.purchase_cost} onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" placeholder="0.00" />
            </div>

            {/* SEO Fields */}
            <div className="border border-border rounded-xl p-4 bg-muted/30">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">🔍 SEO (Otimização para Buscadores)</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meta Title (título nos resultados do Google)</label>
                  <input type="text" maxLength={60} value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" placeholder={form.name || "Título do produto"} />
                  <p className="text-[10px] text-muted-foreground mt-1">{form.meta_title.length}/60 caracteres</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Meta Description (descrição nos resultados do Google)</label>
                  <textarea maxLength={160} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none min-h-[60px]" placeholder="Descrição otimizada para SEO..." />
                  <p className="text-[10px] text-muted-foreground mt-1">{form.meta_description.length}/160 caracteres</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none">
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                Ativo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_customizable} onChange={(e) => setForm({ ...form, is_customizable: e.target.checked })} className="rounded" />
                Personalizável
              </label>
            </div>

            {/* Text position — only shown if customizable */}
            {form.is_customizable && (
              <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <Move className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Posição do texto na garrafa</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Defina onde o nome personalizado aparece sobre a imagem (em %). Ex: Top 42%, Left 50% = centro da garrafa.
                </p>

                {/* Orientation toggle */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Orientação do texto</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, text_orientation: "horizontal", text_rotation: "0" })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                        form.text_orientation === "horizontal"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      ➡️ Horizontal
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, text_orientation: "vertical", text_rotation: "90" })}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                        form.text_orientation === "vertical"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      ⬇️ Vertical
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Posição vertical (Top %)</label>
                    <input
                      type="number" step="1" min="0" max="100"
                      value={form.text_top}
                      onChange={(e) => setForm({ ...form, text_top: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Posição horizontal (Left %)</label>
                    <input
                      type="number" step="1" min="0" max="100"
                      value={form.text_left}
                      onChange={(e) => setForm({ ...form, text_left: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Rotação (graus)</label>
                    <input
                      type="number" step="1" min="-180" max="180"
                      value={form.text_rotation}
                      onChange={(e) => setForm({ ...form, text_rotation: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                    />
                    <p className="text-[9px] text-muted-foreground mt-1">0 = horizontal, 90 = vertical, -90 = vertical invertido</p>
                  </div>
                </div>
              </div>
            )}

            {/* Production days */}
            <div>
              <label className="block text-sm font-medium mb-1">Dias úteis para produção</label>
              <input
                type="number" min="0" max="60"
                value={form.production_days}
                onChange={(e) => setForm({ ...form, production_days: e.target.value })}
                className="w-full max-w-xs px-4 py-3 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                placeholder="3"
              />
              <p className="text-xs text-muted-foreground mt-1">Tempo de produção antes do envio. Será somado ao prazo da transportadora.</p>
            </div>

            {/* Fiscal Fields */}
            <div className="border border-border rounded-xl p-4 bg-muted/30">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">🧾 Dados Fiscais (NF-e)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">NCM *</label>
                  <input type="text" maxLength={8} value={form.ncm} onChange={(e) => setForm({ ...form, ncm: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" placeholder="00000000" />
                  <p className="text-[10px] text-muted-foreground mt-1">8 dígitos. Ex: 73239300 (garrafas térmicas)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">CFOP</label>
                  <input type="number" value={form.cfop} onChange={(e) => setForm({ ...form, cfop: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" placeholder="5102" />
                  <p className="text-[10px] text-muted-foreground mt-1">Ex: 5102 (venda merc. adquirida)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">CEST</label>
                  <input type="text" maxLength={7} value={form.cest} onChange={(e) => setForm({ ...form, cest: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">EAN / Código de Barras</label>
                  <input type="text" value={form.ean} onChange={(e) => setForm({ ...form, ean: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Unidade Comercial</label>
                  <select value={form.unidade_comercial} onChange={(e) => setForm({ ...form, unidade_comercial: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none">
                    <option value="UND">UND - Unidade</option>
                    <option value="CX">CX - Caixa</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="PC">PC - Peça</option>
                    <option value="PAR">PAR - Par</option>
                    <option value="PCT">PCT - Pacote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Origem do Produto</label>
                  <select value={form.origem_produto} onChange={(e) => setForm({ ...form, origem_produto: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none">
                    <option value="0">0 - Nacional</option>
                    <option value="1">1 - Estrangeira (importação direta)</option>
                    <option value="2">2 - Estrangeira (mercado interno)</option>
                    <option value="3">3 - Nacional (importação 40-70%)</option>
                    <option value="5">5 - Nacional (importação ≤40%)</option>
                    <option value="8">8 - Nacional (importação &gt;70%)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">CST ICMS</label>
                  <select value={form.cod_situacao_tributaria_icms} onChange={(e) => setForm({ ...form, cod_situacao_tributaria_icms: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none">
                    <option value="00">00 - Tributada integralmente</option>
                    <option value="10">10 - Tributada com ST</option>
                    <option value="20">20 - Com redução BC</option>
                    <option value="40">40 - Isenta</option>
                    <option value="41">41 - Não tributada</option>
                    <option value="60">60 - ICMS cobrado anteriormente por ST</option>
                    <option value="102">102 - Simples Nacional sem crédito</option>
                    <option value="103">103 - Simples Nacional isento</option>
                    <option value="400">400 - Não tributada pelo Simples</option>
                    <option value="500">500 - ICMS cobrado por ST (Simples)</option>
                    <option value="900">900 - Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">CST PIS</label>
                  <select value={form.cod_situacao_tributaria_pis} onChange={(e) => setForm({ ...form, cod_situacao_tributaria_pis: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none">
                    <option value="01">01 - Tributável alíquota básica</option>
                    <option value="04">04 - Monofásica alíquota zero</option>
                    <option value="06">06 - Alíquota zero</option>
                    <option value="07">07 - Isenta</option>
                    <option value="08">08 - Sem incidência</option>
                    <option value="09">09 - Com suspensão</option>
                    <option value="49">49 - Outras saídas</option>
                    <option value="99">99 - Outras operações</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">CST COFINS</label>
                  <select value={form.cod_situacao_tributaria_cofins} onChange={(e) => setForm({ ...form, cod_situacao_tributaria_cofins: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none">
                    <option value="01">01 - Tributável alíquota básica</option>
                    <option value="04">04 - Monofásica alíquota zero</option>
                    <option value="06">06 - Alíquota zero</option>
                    <option value="07">07 - Isenta</option>
                    <option value="08">08 - Sem incidência</option>
                    <option value="09">09 - Com suspensão</option>
                    <option value="49">49 - Outras saídas</option>
                    <option value="99">99 - Outras operações</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium mb-2">Imagens do produto</label>
              <div className="flex flex-wrap gap-3 mb-3">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {processingImages.has(i) && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    )}
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="w-3 h-3" /></button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              {uploading && <p className="text-xs text-muted-foreground">Enviando...</p>}
            </div>

            {/* Variants with image upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Variantes de cor (cada uma com sua imagem)</label>
              {variants.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {variants.map((v, i) => (
                    <div key={i} className="relative rounded-xl border border-border p-3 bg-muted/50 flex gap-3 items-start">
                      <button type="button" onClick={() => removeVariant(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {/* Color circle */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-10 h-10 rounded-full border-2 border-border" style={{ backgroundColor: v.hex }} />
                        <p className="text-[10px] font-semibold truncate max-w-[60px]">{v.name}</p>
                        {v.price && <p className="text-[10px] text-primary font-bold">R$ {v.price.toFixed(2)}</p>}
                      </div>
                      {/* Variant image */}
                      <div className="flex-1">
                        {v.image ? (
                          <div className="relative w-full h-20 rounded-lg overflow-hidden border border-border">
                            <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...variants];
                                updated[i] = { ...updated[i], image: undefined };
                                setVariants(updated);
                              }}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-full h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors gap-1">
                            {variantUploading === i ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                              <>
                                <Image className="w-4 h-4 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">Imagem desta cor</span>
                              </>
                            )}
                            <input type="file" accept="image/*" onChange={(e) => handleVariantImageUpload(e, i)} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-end gap-2 bg-muted/30 rounded-xl p-3 border border-border">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase">Nome da cor</label>
                  <input type="text" value={newVariant.name} onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })} placeholder="Ex: Rosa, Azul Marinho" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase">Cor</label>
                  <input type="color" value={newVariant.hex} onChange={(e) => setNewVariant({ ...newVariant, hex: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border border-input" />
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-medium text-muted-foreground mb-1 uppercase">Preço (opcional)</label>
                  <input type="number" step="0.01" min="0" value={newVariant.price} onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })} placeholder="R$" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <button type="button" onClick={addVariant} className="btn-outline text-xs px-4 py-2.5 rounded-lg">
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">{editing ? "Salvar" : "Criar Produto"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum produto cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((p) => {
            const pVariants = (p.variants as ProductVariant[]) ?? [];
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 sm:p-3 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">R$ {Number(p.price).toFixed(2)}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      {p.is_active ? "Ativo" : "Inativo"}
                    </span>
                    {p.is_customizable && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        ✏️ Personalizável
                      </span>
                    )}
                    {pVariants.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                        {pVariants.slice(0, 4).map((v, i) => (
                          <span key={i} className="w-3 h-3 rounded-full inline-block border border-border" style={{ backgroundColor: v.hex }} />
                        ))}
                        {pVariants.length > 4 && <span>+{pVariants.length - 4}</span>}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="p-2 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
