import { X, Minus, Plus, Trash2, ShoppingBag, FileText } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { generateQuotePdf } from "@/lib/pdf-utils";
import { toast } from "sonner";
import { useState } from "react";

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const [generatingQuote, setGeneratingQuote] = useState(false);

  const handleQuote = async () => {
    setGeneratingQuote(true);
    try {
      await generateQuotePdf(
        items.map(({ product, quantity, variant }) => ({
          name: product.name + (variant ? ` (${variant.name})` : ""),
          quantity,
          price: variant?.price ?? product.price,
        }))
      );
      toast.success("Orçamento gerado!");
    } catch {
      toast.error("Erro ao gerar orçamento");
    } finally {
      setGeneratingQuote(false);
    }
  };

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  if (!isCartOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50" onClick={() => setIsCartOpen(false)} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="font-heading font-bold text-lg">Carrinho</h2>
            <p className="text-xs text-muted-foreground">{totalItems} {totalItems === 1 ? "item" : "itens"}</p>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="w-9 h-9 opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Seu carrinho está vazio</p>
                <p className="text-sm mt-1">Explore nossos modelos e adicione!</p>
              </div>
            </div>
          ) : (
            items.map((item) => {
              const { id, product, quantity, customName, variant } = item;
              const price = variant?.price ?? product.price;
              const image = variant?.image || product.images?.[0] || "/placeholder.svg";
              return (
                <div key={id} className="flex gap-3 bg-secondary/60 rounded-xl p-3 border border-border/50">
                  <img src={image} alt={product.name} className="w-16 h-20 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                    {variant && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: variant.hex }} />
                        <span className="text-[10px] text-muted-foreground font-medium">{variant.name}</span>
                      </div>
                    )}
                    {customName && (
                      <p className="text-[10px] text-primary font-medium mt-0.5">✏️ Nome: {customName}</p>
                    )}
                    <p className="text-sm font-bold text-primary mt-0.5">{fmt(price)}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button onClick={() => updateQuantity(id, quantity - 1)} className="p-1.5 hover:bg-muted rounded-lg border border-border transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-semibold text-sm w-7 text-center">{quantity}</span>
                      <button onClick={() => updateQuantity(id, quantity + 1)} className="p-1.5 hover:bg-muted rounded-lg border border-border transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => removeFromCart(id)} className="ml-auto p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-5 border-t border-border space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-extrabold text-xl">{fmt(totalPrice)}</span>
            </div>
            <button
              onClick={() => { setIsCartOpen(false); navigate("/checkout"); }}
              className="w-full btn-primary py-3.5 text-sm"
            >
              FINALIZAR COMPRA
            </button>
            <button
              onClick={handleQuote}
              disabled={generatingQuote}
              className="w-full py-3 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {generatingQuote ? "GERANDO..." : "SOLICITAR ORÇAMENTO"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
