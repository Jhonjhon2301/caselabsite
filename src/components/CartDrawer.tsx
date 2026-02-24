import { X, Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import CheckoutForm from "./CheckoutForm";

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalItems } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-secondary/50 z-50" onClick={() => { setIsCartOpen(false); setShowCheckout(false); }} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card z-50 shadow-2xl animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-heading text-2xl">
            {showCheckout ? "FINALIZAR PEDIDO" : `CARRINHO (${totalItems})`}
          </h2>
          <button onClick={() => { setIsCartOpen(false); setShowCheckout(false); }} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showCheckout ? (
          <CheckoutForm onBack={() => setShowCheckout(false)} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-lg">Seu carrinho está vazio</p>
                  <p className="text-sm mt-1">Adicione garrafas para começar!</p>
                </div>
              ) : (
                items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-4 bg-muted/50 rounded-lg p-3">
                    <img src={product.image} alt={product.name} className="w-20 h-24 object-cover rounded-md" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-1 hover:bg-muted rounded">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-sm w-6 text-center">{quantity}</span>
                        <button onClick={() => updateQuantity(product.id, quantity + 1)} className="p-1 hover:bg-muted rounded">
                          <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeFromCart(product.id)} className="ml-auto p-1 text-destructive hover:bg-destructive/10 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full gradient-brand text-primary-foreground py-4 rounded-lg font-semibold text-sm tracking-wider hover:opacity-90 transition-opacity"
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
