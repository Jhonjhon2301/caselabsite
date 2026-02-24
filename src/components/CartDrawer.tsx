import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import CheckoutForm from "./CheckoutForm";

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalItems } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/40 z-50" onClick={() => { setIsCartOpen(false); setShowCheckout(false); }} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-heading font-bold text-lg">
            {showCheckout ? "Finalizar Pedido" : `Carrinho (${totalItems})`}
          </h2>
          <button onClick={() => { setIsCartOpen(false); setShowCheckout(false); }} className="p-1.5 hover:bg-secondary rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showCheckout ? (
          <CheckoutForm onBack={() => setShowCheckout(false)} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                  <ShoppingBag className="w-14 h-14 opacity-30" />
                  <p className="font-medium">Seu carrinho está vazio</p>
                  <p className="text-sm">Explore nossos modelos e adicione!</p>
                </div>
              ) : (
                items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 bg-secondary rounded-lg p-3">
                    <img src={product.image} alt={product.name} className="w-16 h-20 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-1 hover:bg-muted rounded">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-medium text-sm w-5 text-center">{quantity}</span>
                        <button onClick={() => updateQuantity(product.id, quantity + 1)} className="p-1 hover:bg-muted rounded">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeFromCart(product.id)} className="ml-auto p-1 text-destructive hover:bg-destructive/10 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="px-5 py-4 border-t border-border">
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full btn-primary py-3.5"
                >
                  FINALIZAR PEDIDO
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
