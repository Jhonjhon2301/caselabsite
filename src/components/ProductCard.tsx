import { ShoppingCart, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, ProductVariant } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const images = product.images?.length ? product.images : ["/placeholder.svg"];
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const variants: ProductVariant[] = (product.variants as ProductVariant[]) ?? [];
  const currentPrice = selectedVariant?.price ?? product.price;

  return (
    <>
      {/* Card */}
      <div className="group cursor-pointer" onClick={() => { setShowModal(true); setActiveImageIdx(0); }}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted mb-3">
          <img
            src={images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          {selectedVariant && (
            <div className="absolute inset-0 mix-blend-multiply pointer-events-none" style={{ backgroundColor: selectedVariant.hex, opacity: 0.3 }} />
          )}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />

          {product.category_name && (
            <div className="absolute top-2.5 left-2.5">
              <span className="bg-background/90 backdrop-blur-sm text-foreground text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.category_name}
              </span>
            </div>
          )}
          {product.stock_quantity <= 0 && (
            <div className="absolute top-2.5 right-2.5">
              <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">Esgotado</span>
            </div>
          )}

          {variants.length > 0 && (
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              {variants.slice(0, 5).map((v, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedVariant(selectedVariant?.hex === v.hex ? null : v); }}
                  className={`w-5 h-5 rounded-full border-2 shadow-sm transition-all ${selectedVariant?.hex === v.hex ? "border-foreground scale-125" : "border-background/80"}`}
                  style={{ backgroundColor: v.hex }}
                />
              ))}
              {variants.length > 5 && <span className="text-[10px] text-background font-bold self-center">+{variants.length - 5}</span>}
            </div>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            disabled={product.stock_quantity <= 0}
            className="absolute bottom-3 right-3 p-3 bg-foreground text-background rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-110 disabled:opacity-0"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
        <div className="px-1">
          <h3 className="font-heading font-bold text-sm text-foreground leading-tight line-clamp-1">{product.name}</h3>
          <p className="text-lg font-black text-foreground mt-1">{fmt(currentPrice)}</p>
        </div>
      </div>

      {/* Gocase-style product modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6" onClick={() => setShowModal(false)}>
          <div
            className="bg-background rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left — Image gallery */}
              <div className="relative bg-muted">
                <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-md hover:bg-background transition-colors md:hidden">
                  <X className="w-4 h-4" />
                </button>

                {/* Main image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={images[activeImageIdx]} alt={product.name} className="w-full h-full object-cover" />
                  {selectedVariant && (
                    <div className="absolute inset-0 mix-blend-multiply pointer-events-none" style={{ backgroundColor: selectedVariant.hex, opacity: 0.3 }} />
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveImageIdx((i) => (i - 1 + images.length) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveImageIdx((i) => (i + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIdx(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${activeImageIdx === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right — Product info */}
              <div className="p-5 md:p-7 flex flex-col">
                <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-md hover:bg-background transition-colors hidden md:flex">
                  <X className="w-4 h-4" />
                </button>

                {product.category_name && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{product.category_name}</span>
                )}
                <h2 className="font-heading font-black text-xl md:text-2xl mt-1 text-foreground">{product.name}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product.description}</p>

                {product.measurements && (
                  <p className="text-xs text-muted-foreground mt-3 bg-muted rounded-lg px-3 py-2 inline-block w-fit">📐 Medidas: {product.measurements}</p>
                )}

                {/* Variants grid — Gocase style */}
                {variants.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                      Cores disponíveis
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {variants.map((v, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedVariant(selectedVariant?.hex === v.hex ? null : v)}
                          className={`rounded-xl border-2 p-2 text-center transition-all ${
                            selectedVariant?.hex === v.hex
                              ? "border-primary shadow-md"
                              : "border-border hover:border-muted-foreground/40"
                          }`}
                        >
                          {/* Color preview circle */}
                          <div
                            className="w-10 h-10 rounded-full mx-auto mb-1.5 border border-border shadow-inner"
                            style={{ backgroundColor: v.hex }}
                          />
                          <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-1">{v.name}</p>
                          <p className="text-xs font-black text-primary mt-0.5">
                            {fmt(v.price ?? product.price)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price + CTA */}
                <div className="mt-auto pt-5">
                  <p className="text-3xl font-black text-foreground">{fmt(currentPrice)}</p>
                  {selectedVariant && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cor selecionada: <span className="font-semibold text-foreground">{selectedVariant.name}</span>
                    </p>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => { addToCart(product); setShowModal(false); }}
                      disabled={product.stock_quantity <= 0}
                      className="flex-1 btn-primary disabled:opacity-40 py-3.5 rounded-xl text-sm font-bold gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" /> ADICIONAR AO CARRINHO
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
