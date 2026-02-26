import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductVariant } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, ChevronLeft, ChevronRight, ArrowLeft, Truck, ShieldCheck, Repeat, CreditCard } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setProduct(data as unknown as Product);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Produto não encontrado</p>
        <button onClick={() => navigate("/")} className="btn-primary">Voltar à loja</button>
      </div>
    );
  }

  const images = product.images?.length ? product.images : ["/placeholder.svg"];
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const variants: ProductVariant[] = (product.variants as ProductVariant[]) ?? [];
  const currentPrice = selectedVariant?.price ?? product.price;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main>
        {/* Breadcrumb */}
        <div className="bg-muted border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para a loja
            </button>
          </div>
        </div>

        {/* Product detail — GoCase style */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left — Image gallery */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted mb-3">
                <img
                  src={images[activeImageIdx]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {selectedVariant && (
                  <div
                    className="absolute inset-0 mix-blend-multiply pointer-events-none"
                    style={{ backgroundColor: selectedVariant.hex, opacity: 0.3 }}
                  />
                )}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImageIdx((i) => (i - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors shadow-md"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveImageIdx((i) => (i + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors shadow-md"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIdx(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        activeImageIdx === i
                          ? "border-primary shadow-md"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right — Product info */}
            <div className="flex flex-col">
              {product.category_name && (
                <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">
                  {product.category_name}
                </span>
              )}

              <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground">{product.name}</h1>

              <div className="mt-3">
                <p className="text-3xl font-black text-foreground">{fmt(currentPrice)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou <span className="font-bold">3x de {fmt(currentPrice / 3)}</span> sem juros
                </p>
              </div>

              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{product.description}</p>

              {product.measurements && (
                <p className="text-xs text-muted-foreground mt-3 bg-muted rounded-lg px-3 py-2 inline-block w-fit">
                  📐 Medidas: {product.measurements}
                </p>
              )}

              {/* Variants */}
              {variants.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Cores disponíveis
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {variants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(selectedVariant?.hex === v.hex ? null : v)}
                        className={`rounded-xl border-2 p-3 text-center transition-all ${
                          selectedVariant?.hex === v.hex
                            ? "border-primary shadow-md"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full mx-auto mb-1.5 border border-border shadow-inner"
                          style={{ backgroundColor: v.hex }}
                        />
                        <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-1">
                          {v.name}
                        </p>
                        <p className="text-xs font-black text-primary mt-0.5">
                          {fmt(v.price ?? product.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedVariant && (
                <p className="text-xs text-muted-foreground mt-3">
                  Cor selecionada: <span className="font-semibold text-foreground">{selectedVariant.name}</span>
                </p>
              )}

              {/* CTA */}
              <div className="mt-6">
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity <= 0}
                  className="w-full btn-primary py-4 rounded-xl text-sm font-bold gap-2 disabled:opacity-40"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock_quantity <= 0 ? "PRODUTO ESGOTADO" : "ADICIONAR AO CARRINHO"}
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span>Frete grátis a partir de R$299,90</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CreditCard className="w-4 h-4 text-primary shrink-0" />
                  <span>3x sem juros a partir de R$199,90</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Compra 100% segura</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Repeat className="w-4 h-4 text-primary shrink-0" />
                  <span>Troca fácil</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
    </div>
  );
}
