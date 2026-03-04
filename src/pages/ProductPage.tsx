import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductVariant } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Star, Truck, ShieldCheck, Repeat, CreditCard, Type, ChevronRight, ChevronLeft, Heart, Package, Award, Sparkles } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SEOHead from "@/components/SEOHead";
import { trackViewContent } from "@/lib/tracking";
import ProductReviews from "@/components/ProductReviews";
import ProductCard from "@/components/ProductCard";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedScroll, setRelatedScroll] = useState(0);

  // Personalization state
  const [customName, setCustomName] = useState("");

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

  // Fetch related products
  useEffect(() => {
    if (!product) return;
    supabase
      .from("products")
      .select("*, categories(name)")
      .eq("is_active", true)
      .neq("id", product.id)
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setRelatedProducts(
            (data as any[]).map((p) => ({ ...p, category_name: p.categories?.name ?? null })) as Product[]
          );
        }
      });
  }, [product]);

  // Track view
  useEffect(() => {
    if (product) {
      trackViewContent({ id: product.id, name: product.name, price: product.price, category: product.category_name || undefined });
    }
  }, [product]);

  // Reset state on product change
  useEffect(() => {
    setSelectedVariant(null);
    setActiveImageIdx(0);
    setCustomName("");
    setRelatedScroll(0);
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
  const discountPercent = product.discount_percent ?? 0;
  const hasDiscount = discountPercent > 0;
  const originalPrice = hasDiscount ? currentPrice / (1 - discountPercent / 100) : currentPrice;
  const isCustomizable = product.is_customizable;

  const displayImage = selectedVariant?.image || images[activeImageIdx];

  const scrollRelated = (dir: number) => {
    const el = document.getElementById("related-scroll");
    if (el) {
      const scrollAmount = 260;
      el.scrollBy({ left: dir * scrollAmount, behavior: "smooth" });
      setRelatedScroll(el.scrollLeft + dir * scrollAmount);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {product && (
        <SEOHead
          title={(product as any).meta_title || product.name}
          description={(product as any).meta_description || product.description || `${product.name} — Garrafa personalizada Case Lab`}
          image={product.images?.[0]}
          type="product"
          product={{
            name: product.name,
            price: product.price,
            description: (product as any).meta_description || product.description || undefined,
            image: product.images?.[0],
            availability: product.stock_quantity > 0 ? "in stock" : "out of stock",
            category: product.category_name || undefined,
          }}
        />
      )}
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <a href="/" className="hover:text-foreground transition-colors">Início</a>
              <ChevronRight className="w-3 h-3" />
              {product.category_name && (
                <>
                  <span>{product.category_name}</span>
                  <ChevronRight className="w-3 h-3" />
                </>
              )}
              <span className="text-foreground font-medium truncate">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">

            {/* ===== LEFT — Image Gallery ===== */}
            <div className="flex gap-3 lg:flex-1">
              {/* Vertical thumbnails */}
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
                {images.map((img, i) => (
                  <button
                    key={`img-${i}`}
                    onClick={() => { setActiveImageIdx(i); setSelectedVariant(null); }}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      !selectedVariant && activeImageIdx === i
                        ? "border-primary shadow-md"
                        : "border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {variants.filter(v => v.image).map((v, i) => (
                  <button
                    key={`var-${i}`}
                    onClick={() => setSelectedVariant(v)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all relative ${
                      selectedVariant?.hex === v.hex
                        ? "border-primary shadow-md"
                        : "border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                    <div
                      className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-background"
                      style={{ backgroundColor: v.hex }}
                    />
                  </button>
                ))}
              </div>

              {/* Main image */}
              <div className="flex-1 relative">
                <div className="aspect-square overflow-hidden rounded-xl bg-muted relative select-none">
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-300"
                    draggable={false}
                  />

                  {/* Badges */}
                  {isCustomizable && (
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <Type className="w-3 h-3" />
                      Personalizável
                    </div>
                  )}
                  {hasDiscount && discountPercent > 0 && (
                    <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                      {discountPercent}% OFF
                    </div>
                  )}
                </div>

                {/* Mobile thumbnails */}
                <div className="flex sm:hidden gap-2 mt-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={`m-img-${i}`}
                      onClick={() => { setActiveImageIdx(i); setSelectedVariant(null); }}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                        !selectedVariant && activeImageIdx === i ? "border-primary" : "border-border opacity-60"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {variants.filter(v => v.image).map((v, i) => (
                    <button
                      key={`m-var-${i}`}
                      onClick={() => setSelectedVariant(v)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all relative ${
                        selectedVariant?.hex === v.hex ? "border-primary" : "border-border opacity-60"
                      }`}
                    >
                      <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ===== RIGHT — Product Info ===== */}
            <div className="lg:w-[440px] xl:w-[480px] flex flex-col gap-4">
              <h1 className="font-heading font-black text-xl md:text-2xl text-foreground leading-tight">
                {product.name}
              </h1>

              {/* Price + Rating row */}
              <div className="flex items-start justify-between">
                <div>
                  {hasDiscount && (
                    <p className="text-sm text-muted-foreground line-through">{fmt(originalPrice)}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-black text-foreground">{fmt(currentPrice)}</p>
                    {hasDiscount && discountPercent > 0 && (
                      <span className="text-sm font-bold text-destructive">{discountPercent}% OFF</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">avaliações</span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: product.description.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>') }} />
              )}

              {/* Measurements */}
              {product.measurements && (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 inline-block w-fit">
                  📐 Medidas: {product.measurements}
                </p>
              )}

              {/* Production time */}
              {((product as any).production_days ?? 0) > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 w-fit">
                  <Truck className="w-3.5 h-3.5 text-primary" />
                  <span>Prazo de produção: <strong className="text-foreground">{(product as any).production_days} dias úteis</strong> + prazo do frete</span>
                </div>
              )}

              {/* ===== COLOR VARIANTS — Gocase style cards ===== */}
              {variants.length > 0 && (
                <div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {variants.map((v, i) => {
                      const isSelected = selectedVariant?.hex === v.hex;
                      const varPrice = v.price ?? product.price;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedVariant(isSelected ? null : v)}
                          className={`flex flex-col items-center rounded-xl border-2 p-2 transition-all ${
                            isSelected
                              ? "border-primary shadow-md"
                              : "border-border hover:border-muted-foreground/50"
                          }`}
                        >
                          {v.image ? (
                            <img
                              src={v.image}
                              alt={v.name}
                              className="w-full aspect-square object-cover rounded-lg mb-1.5"
                            />
                          ) : (
                            <div
                              className="w-full aspect-square rounded-lg mb-1.5 border border-border/50"
                              style={{ backgroundColor: v.hex }}
                            />
                          )}
                          <span className={`text-[11px] font-semibold leading-tight text-center ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}>
                            {v.name}
                          </span>
                          <span className={`text-[11px] font-bold mt-0.5 px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-foreground text-background"
                          }`}>
                            {fmt(varPrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ===== PERSONALIZATION SECTION ===== */}
              {isCustomizable && (
                <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Type className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Personalize sua garrafa</h3>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Nome ou texto para personalização
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.slice(0, 30))}
                      placeholder="Ex: Marcelo"
                      maxLength={30}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">{customName.length}/30 caracteres • Este nome será gravado na sua garrafa</p>
                  </div>
                </div>
              )}

              {/* CTA + Wishlist */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => addToCart(product, customName || undefined)}
                  disabled={product.stock_quantity <= 0}
                  className="flex-1 bg-foreground text-background py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 shadow-lg"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {product.stock_quantity <= 0 ? "PRODUTO ESGOTADO" : "ADICIONAR AO CARRINHO"}
                </button>
                <button className="w-14 h-14 rounded-xl border-2 border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                  <Heart className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="w-4 h-4 text-primary shrink-0" />
                  <span>Frete grátis acima de R$299,90</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CreditCard className="w-4 h-4 text-primary shrink-0" />
                  <span>Pagamento seguro</span>
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

        {/* ===== RELATED PRODUCTS — "Pessoas que viram... acabaram comprando" ===== */}
        {relatedProducts.length > 0 && (
          <section className="border-t border-border py-10">
            <div className="container mx-auto px-4">
              <h2 className="font-heading font-bold text-lg md:text-xl text-center mb-6">
                Pessoas que viram {product.name}, acabaram comprando
              </h2>
              <div className="relative">
                <div
                  id="related-scroll"
                  className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
                  style={{ scrollbarWidth: "none" }}
                >
                  {relatedProducts.map((p) => (
                    <div key={p.id} className="w-[220px] sm:w-[240px] flex-shrink-0">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
                {/* Arrows */}
                <button
                  onClick={() => scrollRelated(-1)}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors hidden md:flex z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollRelated(1)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors hidden md:flex z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ===== REVIEWS SECTION ===== */}
        <section className="border-t border-border">
          <div className="container mx-auto px-4 py-10">
            <ProductReviews productId={product.id} />
          </div>
        </section>

        {/* ===== MOTIVOS PARA AMAR ===== */}
        <section className="bg-muted/50 border-t border-border py-12">
          <div className="container mx-auto px-4">
            <h2 className="font-heading font-bold text-lg md:text-xl text-center mb-8">
              Motivos para Amar
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Entrega rápida em todo o Brasil.</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Todos os produtos com garantia.</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Qualidade e felicidade garantida.</p>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Produtos únicos e personalizados: a sua cara.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
    </div>
  );
}
