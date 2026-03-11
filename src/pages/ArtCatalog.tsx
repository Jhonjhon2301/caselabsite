import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SEOHead from "@/components/SEOHead";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/types/product";
import { Loader2, Palette, ShoppingCart, MessageCircle, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import LiveChat from "@/components/LiveChat";

interface ArtTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  preview_url: string;
  pdf_url: string | null;
  is_active: boolean;
}

export default function ArtCatalog() {
  const [arts, setArts] = useState<ArtTemplate[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArt, setSelectedArt] = useState<ArtTemplate | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [personName, setPersonName] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todos");
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: artsData }, { data: prodsData }] = await Promise.all([
        supabase.from("art_templates").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("products").select("*").eq("is_active", true).order("name"),
      ]);
      setArts((artsData as ArtTemplate[]) ?? []);
      setProducts((prodsData as unknown as Product[]) ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const categories = ["Todos", ...new Set(arts.map((a) => a.category).filter(Boolean) as string[])];
  const filteredArts = filterCategory === "Todos" ? arts : arts.filter((a) => a.category === filterCategory);

  const handleAddToCart = () => {
    if (!selectedArt || !selectedProduct) {
      toast({ title: "Selecione uma arte e um modelo de garrafa", variant: "destructive" });
      return;
    }
    if (!personName.trim()) {
      toast({ title: "Digite o nome para personalização", variant: "destructive" });
      return;
    }
    addToCart(selectedProduct, `${personName.trim()} | Arte: ${selectedArt.name}`);
    toast({ title: "Adicionado ao carrinho!", description: `${selectedProduct.name} com ${selectedArt.name} — Nome: ${personName.trim()}` });
    setSelectedArt(null);
    setSelectedProduct(null);
    setPersonName("");
  };

  const handleWhatsApp = () => {
    const artName = selectedArt?.name || "arte personalizada";
    const productName = selectedProduct?.name || "garrafa";
    const msg = encodeURIComponent(`Olá! Gostaria de um orçamento personalizado.\nArte: ${artName}\nModelo: ${productName}`);
    window.open(`https://wa.me/5561992629861?text=${msg}`, "_blank");
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Catálogo de Artes | Garrafas Personalizadas" description="Escolha entre dezenas de artes prontas e combine com o modelo de garrafa que preferir." />
      <TopBar />
      <Header searchQuery="" onSearchChange={() => {}} />
      <main className="container mx-auto px-3 sm:px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-foreground mb-2">
            <Palette className="inline w-7 h-7 mr-2 text-primary" />
            Catálogo de Artes
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Escolha uma arte pronta, selecione o modelo de garrafa e compre direto. Quer algo diferente? Fale conosco!
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Step 1: Pick art */}
            <div className="lg:col-span-2">
              <h2 className="font-heading font-bold text-lg mb-4">1. Escolha a Arte</h2>

              {/* Category filter */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      filterCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {filteredArts.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">Nenhuma arte cadastrada ainda.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredArts.map((art) => (
                    <button
                      key={art.id}
                      onClick={() => setSelectedArt(art)}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                        selectedArt?.id === art.id
                          ? "border-primary ring-2 ring-primary/30 scale-[1.02]"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="aspect-square bg-muted">
                        <img
                          src={art.preview_url}
                          alt={art.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2 bg-background">
                        <p className="text-xs font-bold truncate">{art.name}</p>
                        {art.category && <p className="text-[10px] text-muted-foreground">{art.category}</p>}
                      </div>
                      {selectedArt?.id === art.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-foreground text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Pick bottle + checkout */}
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-bold text-lg mb-4">2. Escolha o Modelo</h2>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedProduct?.id === p.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={p.images?.[0] || "/placeholder.svg"}
                        alt={p.name}
                        className="w-12 h-12 rounded-lg object-cover bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{p.name}</p>
                        <p className="text-xs text-primary font-bold">{fmt(p.price)}</p>
                      </div>
                      {selectedProduct?.id === p.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <span className="text-primary-foreground text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Name */}
              <div>
                <h2 className="font-heading font-bold text-lg mb-4">
                  <Type className="inline w-5 h-5 mr-1" />
                  3. Digite o Nome
                </h2>
                <Input
                  placeholder="Ex: Maria, João..."
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  maxLength={30}
                  className="text-base"
                />
                <p className="text-xs text-muted-foreground mt-1">Nome que será gravado na garrafa</p>
              </div>

              {/* Summary */}
              <div className="bg-card rounded-xl border border-border p-4 space-y-4">
                <h3 className="font-heading font-bold text-sm">Resumo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Arte:</span>
                    <span className="font-medium">{selectedArt?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Modelo:</span>
                    <span className="font-medium">{selectedProduct?.name || "—"}</span>
                  </div>
                  {selectedProduct && (
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-bold">Total:</span>
                      <span className="font-black text-primary text-lg">{fmt(selectedProduct.price)}</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedArt || !selectedProduct}
                  className="w-full gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Adicionar ao Carrinho
                </Button>

                <Button
                  variant="outline"
                  onClick={handleWhatsApp}
                  className="w-full gap-2 text-[hsl(142_70%_45%)] border-[hsl(142_70%_45%)] hover:bg-[hsl(142_70%_45%)]/10"
                >
                  <MessageCircle className="w-4 h-4" />
                  Quero algo diferente
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
      <LiveChat />
    </div>
  );
}
