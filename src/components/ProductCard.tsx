import { ShoppingCart, X, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import type { Product, ProductVariant } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const images = product.images?.length ? product.images : ["/placeholder.svg"];
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const variants: ProductVariant[] = (product.variants as ProductVariant[]) ?? [];
  const currentPrice = selectedVariant?.price ?? product.price;

  return (
    <div
      className="group cursor-pointer"
      onClick={() => navigate(`/produto/${product.id}`)}
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

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.stock_quantity <= 0 && (
            <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
              Esgotado
            </span>
          )}
        </div>

        {/* Quick-view icon */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/produto/${product.id}`);
            }}
            className="w-8 h-8 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-background transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>

        {/* Add to cart */}
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
              <span className="text-[10px] text-background font-bold self-center ml-0.5">
                +{variants.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
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
  );
}
