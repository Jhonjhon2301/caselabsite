import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductVariant } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Star, Truck, ShieldCheck, Repeat, CreditCard, Type, Palette } from "lucide-react";
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
  const [customName, setCustomName] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState(28);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

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

  // Draw personalization preview on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !product) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.naturalWidth || 600;
      canvas.height = img.naturalHeight || 600;

      // Draw base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply color overlay if variant selected
      if (selectedVariant?.hex) {
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = selectedVariant.hex;
        ctx.globalAlpha = 0.25;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }

      // Draw custom name text
      if (customName.trim()) {
        const scale = canvas.width / 600;
        const size = Math.round(fontSize * scale);
        ctx.font = `bold ${size}px 'Montserrat', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Text position — centered on the bottle body (~40% from top)
        const x = canvas.width / 2;
        const y = canvas.height * 0.42;

        // Shadow for readability
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4 * scale;
        ctx.shadowOffsetX = 1 * scale;
        ctx.shadowOffsetY = 1 * scale;

        ctx.fillStyle = textColor;
        ctx.fillText(customName, x, y, canvas.width * 0.6);

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    };

    if (img.complete) {
      draw();
    } else {
      img.onload = draw;
    }
  }, [product, selectedVariant, customName, textColor, fontSize, activeImageIdx]);

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

  const isCustomizable = product.is_customizable;

  const textColorOptions = [
    { label: "Branco", hex: "#FFFFFF" },
    { label: "Preto", hex: "#000000" },
    { label: "Dourado", hex: "#D4AF37" },
    { label: "Prata", hex: "#C0C0C0" },
    { label: "Rosa", hex: "#FF69B4" },
    { label: "Vermelho", hex: "#FF0000" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main>
        {/* Breadcrumb */}
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

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Left — Image preview */}
            <div className="flex gap-3 lg:flex-1">
              {/* Vertical thumbnails */}
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

              {/* Main image / Canvas preview */}
              <div className="flex-1 relative">
                <div className="aspect-square overflow-hidden rounded-xl bg-muted relative">
                  {/* Hidden image for canvas source */}
                  <img
                    ref={imgRef}
                    src={images[activeImageIdx]}
                    alt={product.name}
                    className={isCustomizable || selectedVariant ? "hidden" : "w-full h-full object-cover"}
                    crossOrigin="anonymous"
                  />
                  {/* Canvas preview when customizing */}
                  {(isCustomizable || selectedVariant) && (
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Fallback: show image with CSS overlay when no customization */}
                  {!isCustomizable && !selectedVariant && (
                    <img
                      src={images[activeImageIdx]}
                      alt={product.name}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  )}

                  {/* Personalization badge */}
                  {isCustomizable && (
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <Type className="w-3 h-3" />
                      Personalizável
                    </div>
                  )}
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

            {/* Right — Product info + customization */}
            <div className="lg:w-[440px] xl:w-[480px] flex flex-col">
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

              {/* === PERSONALIZATION SECTION === */}
              {isCustomizable && (
                <div className="mt-5 border border-border rounded-xl p-4 bg-muted/30">
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
                      className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">{customName.length}/20 caracteres</p>
                  </div>

                  {/* Text color picker */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5" />
                      Cor do texto
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {textColorOptions.map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => setTextColor(c.hex)}
                          title={c.label}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            textColor === c.hex
                              ? "border-primary scale-110 shadow-md"
                              : "border-border hover:border-muted-foreground"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Font size */}
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Tamanho do texto
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={16}
                        max={48}
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="flex-1 accent-primary"
                      />
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{fontSize}px</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Color Variants — GoCase card style */}
              {variants.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    Cor da garrafa
                    {selectedVariant && (
                      <span className="text-primary ml-1">— {selectedVariant.name}</span>
                    )}
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
