import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductVariant } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Star, Truck, ShieldCheck, Repeat, CreditCard } from "lucide-react";
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
      .select("*, categories(name)")
      .eq("id", id)
      .eq("is_active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          const p = data as any;
          setProduct({ ...p, category_name: p.categories?.name ?? null } as Product);
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
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const variants: ProductVariant[] = (product.variants as ProductVariant[]) ?? [];
  const currentPrice = selectedVariant?.price ?? product.price;
  const originalPrice = product.purchase_cost > currentPrice ? product.purchase_cost : currentPrice * 1.3;
  const hasDiscount = originalPrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main>
        {/* Breadcrumb — GoCase style */}
        <div className="border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-xs text-muted-foreground">
              <a href="/" className="hover:text-foreground transition-colors">Início</a>
              <span>›</span>
              {product.category_name && (
                <>
                  <span>{product.category_name}</span>
                  <span>›</span>
                </>
              )}
              <span className="text-foreground font-medium truncate">{product.name}</span>
            </nav>
          </div>
        </div>

        {/* Product detail — GoCase layout */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Left — Vertical thumbnails + main image */}
            <div className="flex gap-3 lg:flex-1">
              {/* Vertical thumbnail strip */}
              {images.length > 1 && (
                <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIdx(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIdx === i
                          ? "border-primary shadow-md"
                          : "border-border opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="flex-1 relative">
                <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                  <img
                    src={images[activeImageIdx]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Mobile thumbnails */}
                {images.length > 1 && (
                  <div className="flex sm:hidden gap-2 mt-2 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIdx(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          activeImageIdx === i ? "border-primary" : "border-border opacity-60"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right — Product info */}
            <div className="lg:w-[420px] xl:w-[460px] flex flex-col">
              <h1 className="font-heading font-black text-xl md:text-2xl text-foreground leading-tight">
                {product.name}
              </h1>

              {/* Price + Rating */}
              <div className="flex items-start justify-between mt-3">
                <div>
                  {hasDiscount && (
                    <p className="text-sm text-muted-foreground line-through">{fmt(originalPrice)}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-black text-foreground">{fmt(currentPrice)}</p>
                    {hasDiscount && discountPercent > 0 && (
                      <span className="text-xs font-bold text-destructive">{discountPercent}% OFF</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ou <span className="font-bold">3x de {fmt(currentPrice / 3)}</span> sem juros
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                  <span className="text-[10px] text-muted-foreground ml-1">avaliações</span>
                </div>
              </div>

              {/* Promo callout */}
              <div className="mt-4 border-l-4 border-primary bg-primary/5 rounded-r-lg p-3">
                <p className="text-xs font-bold text-foreground">
                  PISCOU, PERDEU: Garrafas a partir de {fmt(currentPrice)} + MIMO!
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{product.description}</p>
              )}

              {/* Measurements */}
              {product.measurements && (
                <p className="text-xs text-muted-foreground mt-3 bg-muted rounded-lg px-3 py-2 inline-block w-fit">
                  📐 Medidas: {product.measurements}
                </p>
              )}

              {/* Color Variants — GoCase card style */}
              {variants.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                    Cores disponíveis
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {variants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(selectedVariant?.hex === v.hex ? null : v)}
                        className={`rounded-xl border-2 p-2 text-center transition-all ${
                          selectedVariant?.hex === v.hex
                            ? "border-primary shadow-md bg-primary/5"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full mx-auto mb-1 border border-border/50"
                          style={{ backgroundColor: v.hex }}
                        />
                        <p className="text-[10px] font-semibold text-foreground leading-tight line-clamp-1">
                          {v.name}
                        </p>
                        <p className="text-[11px] font-black text-primary mt-0.5">
                          {fmt(v.price ?? product.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-6">
                <button
                  onClick={() => addToCart(product)}
                  disabled={product.stock_quantity <= 0}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-40 shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock_quantity <= 0 ? "PRODUTO ESGOTADO" : "COMPRAR"}
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span>Frete grátis a partir de R$299,90</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CreditCard className="w-4 h-4 text-primary shrink-0" />
                  <span>3x sem juros</span>
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
