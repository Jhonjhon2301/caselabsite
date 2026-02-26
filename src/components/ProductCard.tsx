import { ShoppingCart, X, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
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
      {/* Card — GoCase style */}
      <div
        className="group cursor-pointer"
        onClick={() => {
          setShowModal(true);
          setActiveImageIdx(0);
        }}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted mb-2.5">
          <img
            src={images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
          {selectedVariant && (
            <div
              className="absolute inset-0 mix-blend-multiply pointer-events-none"
              style={{ backgroundColor: selectedVariant.hex, opacity: 0.3 }}
            />
          )}

          {/* Badges — GoCase style top-left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.stock_quantity <= 0 && (
              <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Esgotado
              </span>
            )}
          </div>

          {/* Quick-view icons — GoCase style */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="w-8 h-8 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-background transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>

          {/* Add to cart button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCart(product);
            }}
            disabled={product.stock_quantity <= 0}
            className="absolute bottom-2 right-2 p-2.5 bg-foreground text-background rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:scale-110 disabled:opacity-0"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>

          {/* Color variants */}
          {variants.length > 0 && (
            <div className="absolute bottom-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {variants.slice(0, 4).map((v, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariant(selectedVariant?.hex === v.hex ? null : v);
                  }}
                  className={`w-5 h-5 rounded-full border-2 shadow-sm transition-all ${
                    selectedVariant?.hex === v.hex ? "border-foreground scale-125" : "border-background/80"
                  }`}
                  style={{ backgroundColor: v.hex }}
                />
              ))}
              {variants.length > 4 && (
                <span className="text-[10px] text-background font-bold self-center ml-0.5">+{variants.length - 4}</span>
              )}
            </div>
          )}
        </div>

        {/* Info — GoCase style */}
        <div className="px-0.5">
          <h3 className="font-heading font-bold text-[13px] text-foreground leading-tight line-clamp-2 mb-1">
            {product.name}
          </h3>
          <p className="text-base font-black text-foreground">{fmt(currentPrice)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            ou 3x de {fmt(currentPrice / 3)} sem juros
          </p>
        </div>
      </div>

      {/* Product modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-6"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-background rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              {/* Left — Image gallery */}
              <div className="relative bg-muted">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-3 right-3 z-10 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-md hover:bg-background transition-colors md:hidden"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative aspect-square overflow-hidden">
                  <img src={images[activeImageIdx]} alt={product.name} className="w-full h-full object-cover" />
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

                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIdx(i)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          activeImageIdx === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right — Product info */}
              <div className="p-5 md:p-7 flex flex-col">
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-md hover:bg-background transition-colors hidden md:flex"
                >
                  <X className="w-4 h-4" />
                </button>

                {product.category_name && (
                  <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                    {product.category_name}
                  </span>
                )}
                <h2 className="font-heading font-black text-xl md:text-2xl mt-1 text-foreground">{product.name}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product.description}</p>

                {product.measurements && (
                  <p className="text-xs text-muted-foreground mt-3 bg-muted rounded-lg px-3 py-2 inline-block w-fit">
                    📐 Medidas: {product.measurements}
                  </p>
                )}

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
                          <div
                            className="w-10 h-10 rounded-full mx-auto mb-1.5 border border-border shadow-inner"
                            style={{ backgroundColor: v.hex }}
                          />
                          <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-1">{v.name}</p>
                          <p className="text-xs font-black text-primary mt-0.5">{fmt(v.price ?? product.price)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-5">
                  <p className="text-3xl font-black text-foreground">{fmt(currentPrice)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ou 3x de <span className="font-bold">{fmt(currentPrice / 3)}</span> sem juros
                  </p>
                  {selectedVariant && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Cor: <span className="font-semibold text-foreground">{selectedVariant.name}</span>
                    </p>
                  )}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        addToCart(product);
                        setShowModal(false);
                      }}
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
