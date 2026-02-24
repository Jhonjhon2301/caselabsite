import { ShoppingCart } from "lucide-react";
import type { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const { addToCart } = useCart();

  return (
    <div
      className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/30 transition-colors duration-300 flex items-center justify-center">
          <button
            onClick={() => addToCart(product)}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 gradient-brand text-primary-foreground px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 hover:scale-105"
          >
            <ShoppingCart className="w-4 h-4" />
            Quero essa!
          </button>
        </div>
      </div>
      <div className="p-4">
        <span className="text-xs font-medium text-primary tracking-wider uppercase">{product.category}</span>
        <h3 className="font-heading text-xl text-foreground mt-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
      </div>
    </div>
  );
}
