import { ShoppingCart } from "lucide-react";
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
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const variants: ProductVariant[] = (product.variants as ProductVariant[]) ?? [];
  const currentPrice = selectedVariant?.price ?? product.price;

  // Discount from admin
  const discountPercent = product.discount_percent ?? 0;
  const hasDiscount = discountPercent > 0;
  const originalPrice = hasDiscount ? currentPrice / (1 - discountPercent / 100) : currentPrice;

  return (
    <div className="group cursor-pointer bg-background rounded-xl border border-border hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden rounded-t-xl bg-muted"
        onClick={() => navigate(`/produto/${product.id}`)}
      >
        <img
          src={selectedVariant?.image || images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        {product.stock_quantity <= 0 && (
          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
            Esgotado
          </span>
        )}
        {hasDiscount && (
          <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {/* Color swatches */}
        {variants.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {variants.slice(0, 5).map((v, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVariant(selectedVariant?.hex === v.hex ? null : v);
                }}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  selectedVariant?.hex === v.hex
                    ? "border-primary scale-125"
                    : "border-border"
                }`}
                style={{ backgroundColor: v.hex }}
                title={v.name}
              />
            ))}
            {variants.length > 5 && (
              <span className="text-[10px] font-bold text-muted-foreground ml-0.5">
                +{variants.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Name */}
        <h3
          className="font-heading font-bold text-[13px] text-foreground leading-tight line-clamp-2 mb-2 min-h-[32px]"
          onClick={() => navigate(`/produto/${product.id}`)}
        >
          {product.name}
        </h3>

        {/* Price */}
        <div className="mb-2">
          {hasDiscount && (
            <p className="text-xs text-muted-foreground line-through">{fmt(originalPrice)}</p>
          )}
          <div className="flex items-center gap-2">
            <p className="text-base font-black text-foreground">{fmt(currentPrice)}</p>
          </div>
        </div>

        {/* Buy button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          disabled={product.stock_quantity <= 0}
          className="w-full bg-primary text-primary-foreground text-xs font-bold py-2.5 rounded-lg hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Comprar
        </button>
      </div>
    </div>
  );
}
