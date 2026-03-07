import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type { Product, ProductVariant } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { trackAddToCart } from "@/lib/tracking";

export interface CartItem {
  id: string; // unique key: productId__variantHex__customName
  product: Product;
  quantity: number;
  customName?: string;
  variant?: ProductVariant;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, customName?: string, variant?: ProductVariant) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function makeItemId(productId: string, variant?: ProductVariant, customName?: string): string {
  return `${productId}__${variant?.hex || ""}__${customName?.trim() || ""}`;
}

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

  const saveAbandonedCart = useCallback(async (cartItems: CartItem[]) => {
    if (cartItems.length === 0) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionId = getSessionId();
      const total = cartItems.reduce((s, i) => {
        const price = i.variant?.price ?? i.product.price;
        return s + price * i.quantity;
      }, 0);
      const itemsData = cartItems.map(i => ({
        product_id: i.product.id,
        name: i.product.name,
        variant_name: i.variant?.name || null,
        variant_hex: i.variant?.hex || null,
        price: i.variant?.price ?? i.product.price,
        quantity: i.quantity,
        image: i.variant?.image || i.product.images?.[0] || null,
      }));

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

  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveAbandonedCart(items);
    }, 5000);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [items, saveAbandonedCart]);

  const addToCart = useCallback((product: Product, customName?: string, variant?: ProductVariant) => {
    const itemId = makeItemId(product.id, variant, customName);
    setItems((prev) => {
      // Custom name items with same name+variant merge
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        return prev.map((i) => i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: itemId, product, quantity: 1, customName: customName?.trim() || undefined, variant: variant || undefined }];
    });
    setIsCartOpen(true);
    const price = variant?.price ?? product.price;
    trackAddToCart({ id: product.id, name: product.name, price });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
      );
    }
  }, []);

  const clearCart = useCallback(async () => {
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
  const totalPrice = items.reduce((sum, i) => {
    const price = i.variant?.price ?? i.product.price;
    return sum + price * i.quantity;
  }, 0);

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
