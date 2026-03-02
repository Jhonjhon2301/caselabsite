import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductVariant } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Star, Truck, ShieldCheck, Repeat, CreditCard, Type, Palette, ChevronRight } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SEOHead from "@/components/SEOHead";
import { trackViewContent } from "@/lib/tracking";
import ProductReviews from "@/components/ProductReviews";
import { lazy, Suspense } from "react";

const ProductSimulator3D = lazy(() => import("@/components/ProductSimulator3D"));

const FONT_OPTIONS = [
  { label: "Clássica", family: "'Montserrat', sans-serif", weight: "700" },
  { label: "Elegante", family: "'Georgia', serif", weight: "400" },
  { label: "Moderna", family: "'Inter', sans-serif", weight: "600" },
  { label: "Cursiva", family: "'Segoe Script', 'Brush Script MT', cursive", weight: "400" },
  { label: "Forte", family: "'Impact', 'Arial Black', sans-serif", weight: "700" },
  { label: "Light", family: "'Montserrat', sans-serif", weight: "300" },
];

const TEXT_COLORS = [
  { label: "Branco", hex: "#FFFFFF" },
  { label: "Preto", hex: "#000000" },
  { label: "Dourado", hex: "#D4AF37" },
  { label: "Prata", hex: "#C0C0C0" },
  { label: "Rosa", hex: "#FF69B4" },
  { label: "Vermelho", hex: "#FF0000" },
  { label: "Azul", hex: "#1E90FF" },
];

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Personalization state
  const [customName, setCustomName] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState(24);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);

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

  // Track view - must be before early returns
  useEffect(() => {
    if (product) {
      trackViewContent({ id: product.id, name: product.name, price: product.price, category: product.category_name || undefined });
    }
  }, [product]);

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

  const textTop = product.text_top ?? 42;
  const textLeft = product.text_left ?? 50;
  const textRotation = product.text_rotation ?? 0;

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

            {/* ===== LEFT — Image Gallery + Live Preview ===== */}
            <div className="flex gap-3 lg:flex-1">
              {/* Vertical thumbnails (gallery images + variant images) */}
              <div className="hidden sm:flex flex-col gap-2 w-16 shrink-0">
                {/* Gallery thumbnails */}
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
                {/* Variant image thumbnails */}
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

              {/* Main image with CSS overlay */}
              <div className="flex-1 relative">
                <div className="aspect-square overflow-hidden rounded-xl bg-muted relative select-none">
                  {/* Product image — shows variant image or gallery image */}
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-300"
                    draggable={false}
                  />

                  {/* Text overlay — CSS positioned using DB coordinates */}
                  {isCustomizable && customName.trim() && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        top: `${textTop}%`,
                        left: `${textLeft}%`,
                        transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                      }}
                    >
                      <span
                        className="text-center leading-tight select-none whitespace-nowrap"
                        style={{
                          fontFamily: selectedFont.family,
                          fontWeight: selectedFont.weight,
                          fontSize: `${fontSize}px`,
                          color: textColor,
                          textShadow: "0 2px 8px rgba(0,0,0,0.5), 0 1px 3px rgba(0,0,0,0.3)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {customName}
                      </span>
                    </div>
                  )}

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

            {/* ===== RIGHT — Product Info + Customization ===== */}
            <div className="lg:w-[440px] xl:w-[480px] flex flex-col gap-4">
              <h1 className="font-heading font-black text-xl md:text-2xl text-foreground leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">(avaliações)</span>
              </div>

              {/* Price */}
              <div>
                {hasDiscount && (
                  <p className="text-sm text-muted-foreground line-through">{fmt(originalPrice)}</p>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-foreground">{fmt(currentPrice)}</p>
                  {hasDiscount && discountPercent > 0 && (
                    <span className="text-xs font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{discountPercent}% OFF</span>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              )}

              {/* Measurements */}
              {product.measurements && (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 inline-block w-fit">
                  📐 Medidas: {product.measurements}
                </p>
              )}

              {/* ===== COLOR VARIANTS ===== */}
              {variants.length > 0 && (
                <div className="border border-border rounded-xl p-4 bg-card">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    Cor da garrafa
                    {selectedVariant && (
                      <span className="text-primary ml-1 normal-case">— {selectedVariant.name}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(selectedVariant?.hex === v.hex ? null : v)}
                        className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 transition-all text-xs ${
                          selectedVariant?.hex === v.hex
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-border/50 shrink-0"
                          style={{ backgroundColor: v.hex }}
                        />
                        <span className="font-semibold text-foreground">{v.name}</span>
                        {v.price && v.price !== product.price && (
                          <span className="font-black text-primary">{fmt(v.price)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== PERSONALIZATION SECTION ===== */}
              {isCustomizable && (
                <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
                  <div className="flex items-center gap-2 mb-4">
                    <Type className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Personalize sua garrafa</h3>
                  </div>

                  {/* Name input */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Digite seu nome ou texto
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.slice(0, 20))}
                      placeholder="Ex: Marcelo"
                      maxLength={20}
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">{customName.length}/20 caracteres</p>
                  </div>

                  {/* Font picker */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Escolha a fonte
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {FONT_OPTIONS.map((font) => (
                        <button
                          key={font.label}
                          onClick={() => setSelectedFont(font)}
                          className={`rounded-lg border-2 px-3 py-2.5 text-center transition-all ${
                            selectedFont.label === font.label
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border hover:border-muted-foreground/40 bg-background"
                          }`}
                        >
                          <span
                            className="text-sm text-foreground block leading-tight"
                            style={{ fontFamily: font.family, fontWeight: font.weight }}
                          >
                            {customName.trim() || "Abc"}
                          </span>
                          <span className="text-[9px] text-muted-foreground mt-0.5 block">{font.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text color picker */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      Cor do texto
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => setTextColor(c.hex)}
                          title={c.label}
                          className={`w-8 h-8 rounded-full border-2 transition-all relative ${
                            textColor === c.hex
                              ? "border-primary scale-110 shadow-md"
                              : "border-border hover:border-muted-foreground"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {textColor === c.hex && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full border-2 border-primary bg-primary" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font size slider */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Tamanho do texto
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground">A</span>
                      <input
                        type="range"
                        min={14}
                        max={42}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="flex-1 accent-primary h-1.5"
                      />
                      <span className="text-sm font-bold text-muted-foreground">A</span>
                    </div>
                  </div>

                  {/* 3D Simulator */}
                  {customName.trim() && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">🎮 Visualização 3D</p>
                      <Suspense fallback={<div className="aspect-square rounded-xl bg-muted animate-pulse" />}>
                        <ProductSimulator3D
                          customName={customName}
                          textColor={textColor}
                          fontSize={fontSize}
                          fontFamily={selectedFont.family}
                          bottleColor={selectedVariant?.hex || "#333333"}
                        />
                      </Suspense>
                    </div>
                  )}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={() => addToCart(product)}
                disabled={product.stock_quantity <= 0}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-40 shadow-lg mt-2"
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock_quantity <= 0 ? "PRODUTO ESGOTADO" : "COMPRAR AGORA"}
              </button>

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

            {/* Reviews Section */}
            <ProductReviews productId={product.id} />
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppFloat />
    </div>
  );
}
