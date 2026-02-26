import { ShoppingCart, X } from "lucide-react";
import type { Product } from "@/types/product";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const image = product.images?.[0] || "/placeholder.svg";
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const colors = product.colors ?? [];

  return (
    <>
      <div className="group cursor-pointer" onClick={() => setShowModal(true)}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted mb-3">
          <img 
            src={image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
            loading="lazy" 
          />
          
          {/* Color overlay */}
          {selectedColor && (
            <div 
              className="absolute inset-0 mix-blend-multiply pointer-events-none" 
              style={{ backgroundColor: selectedColor, opacity: 0.35 }} 
            />
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
              <span className="bg-destructive text-destructive-foreground text-[9px] font-bold px-2.5 py-1 rounded-full uppercase">
                Esgotado
              </span>
            </div>
          )}

          {/* Color dots on card */}
          {colors.length > 0 && (
            <div className="absolute bottom-3 left-3 flex gap-1.5">
              {colors.slice(0, 5).map((color, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setSelectedColor(selectedColor === color ? null : color); }}
                  className={`w-5 h-5 rounded-full border-2 transition-all duration-200 shadow-sm ${selectedColor === color ? "border-foreground scale-125" : "border-background/80"}`}
                  style={{ backgroundColor: color }}
                />
              ))}
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
          <p className="text-lg font-black text-foreground mt-1">{fmt(product.price)}</p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-background rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <img src={image} alt={product.name} className="w-full aspect-[3/4] object-cover" />
              {selectedColor && (
                <div 
                  className="absolute inset-0 mix-blend-multiply pointer-events-none" 
                  style={{ backgroundColor: selectedColor, opacity: 0.35 }} 
                />
              )}
              <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full shadow-md hover:bg-background transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              {product.category_name && <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">{product.category_name}</span>}
              <h3 className="font-heading font-bold text-xl mt-1.5">{product.name}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{product.description}</p>
              {product.measurements && <p className="text-xs text-muted-foreground mt-2 bg-muted rounded-lg px-3 py-2 inline-block">📐 Medidas: {product.measurements}</p>}
              
              {/* Color selector in modal */}
              {colors.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cor da garrafa</p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${selectedColor === color ? "border-foreground ring-2 ring-foreground/20 scale-110" : "border-border hover:scale-105"}`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              <p className="text-2xl font-extrabold text-foreground mt-4">{fmt(product.price)}</p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { addToCart(product); setShowModal(false); }}
                  disabled={product.stock_quantity <= 0}
                  className="flex-1 btn-primary disabled:opacity-40 py-3 rounded-full"
                >
                  <ShoppingCart className="w-4 h-4" /> Adicionar ao Carrinho
                </button>
                <button onClick={() => setShowModal(false)} className="btn-outline px-5 rounded-full">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
