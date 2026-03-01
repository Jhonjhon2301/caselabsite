import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { trackAddToCart } from "@/lib/tracking";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate or retrieve a session ID for anonymous cart tracking
function getSessionId(): string {
  let sid = sessionStorage.getItem("cart_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("cart_session_id", sid);
  }
  return sid;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Save abandoned cart to DB (debounced)
  const saveAbandonedCart = useCallback(async (cartItems: CartItem[]) => {
    if (cartItems.length === 0) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // Only save for authenticated users (RLS requires it)

      const sessionId = getSessionId();
      const total = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
      const itemsData = cartItems.map(i => ({
        product_id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.images?.[0] || null,
      }));

      // Upsert by session_id for this user
      const { data: existing } = await supabase
        .from("abandoned_carts")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .is("recovered_at", null)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("abandoned_carts")
          .update({ items: itemsData, total, recovery_status: "pending" } as any)
          .eq("id", existing.id);
      } else {
        await supabase
          .from("abandoned_carts")
          .insert({
            session_id: sessionId,
            user_id: user.id,
            items: itemsData,
            total,
          } as any);
      }
    } catch (err) {
      console.error("[Cart] Error saving abandoned cart:", err);
    }
  }, []);

  // Debounce save on cart changes
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveAbandonedCart(items);
    }, 5000); // Save after 5s of inactivity
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [items, saveAbandonedCart]);

  const addToCart = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
    trackAddToCart({ id: product.id, name: product.name, price: product.price });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(async () => {
    // Mark cart as recovered when purchase completes
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const sessionId = getSessionId();
        await supabase
          .from("abandoned_carts")
          .update({ recovered_at: new Date().toISOString(), recovery_status: "recovered" } as any)
          .eq("session_id", sessionId)
          .eq("user_id", user.id)
          .is("recovered_at", null);
      }
    } catch {}
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
