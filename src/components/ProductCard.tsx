import { ShoppingCart, Eye } from "lucide-react";
import type { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [showModal, setShowModal] = useState(false);

  const image = product.images?.[0] || "/placeholder.svg";
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  return (
    <>
      <div className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted cursor-pointer" onClick={() => setShowModal(true)}>
          <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          {product.category_name && (
            <div className="absolute top-3 left-3">
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.category_name}
              </span>
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Eye className="w-4 h-4 text-foreground" />
          </button>
        </div>
        <div className="p-4">
          <h3 className="font-heading font-bold text-sm text-foreground leading-tight">{product.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          <p className="text-base font-bold text-primary mt-2">{fmt(product.price)}</p>
          {product.stock_quantity <= 0 && (
            <p className="text-xs text-destructive mt-1">Esgotado</p>
          )}
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock_quantity <= 0}
            className="mt-3 w-full btn-primary text-xs py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {product.stock_quantity > 0 ? "Adicionar" : "Esgotado"}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-background rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={image} alt={product.name} className="w-full aspect-[3/4] object-cover" />
            <div className="p-6">
              {product.category_name && <span className="text-xs font-bold text-primary uppercase tracking-wider">{product.category_name}</span>}
              <h3 className="font-heading font-bold text-xl mt-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
              {product.measurements && <p className="text-xs text-muted-foreground mt-1">Medidas: {product.measurements}</p>}
              <p className="text-2xl font-bold text-primary mt-3">{fmt(product.price)}</p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => { addToCart(product); setShowModal(false); }}
                  disabled={product.stock_quantity <= 0}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4" /> Adicionar
                </button>
                <button onClick={() => setShowModal(false)} className="btn-outline">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
