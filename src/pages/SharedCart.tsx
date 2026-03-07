import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { ShoppingCart, ArrowRight, Package, CreditCard, QrCode } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

interface SharedCartItem {
  product_id: string;
  product_name: string;
  variant_name?: string;
  variant_hex?: string;
  variant_image?: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function SharedCart() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  useEffect(() => {
    if (!id) return;
    supabase.from("shared_carts").select("*").eq("id", id).single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          toast.error("Carrinho não encontrado");
          navigate("/");
          return;
        }
        setCart(data);
        // Mark as viewed
        if ((data as any).status === "pending") {
          await supabase.from("shared_carts").update({ status: "viewed" } as any).eq("id", id);
        }
        setLoading(false);
      });
  }, [id]);

  const handleAddAllToCart = async () => {
    if (!cart) return;
    setAdding(true);
    const items = cart.items as SharedCartItem[];
    
    // Fetch actual products to add to cart properly
    const productIds = [...new Set(items.map(i => i.product_id))];
    const { data: products } = await supabase.from("products").select("*, categories(name)").in("id", productIds);
    
    if (!products) {
      toast.error("Erro ao carregar produtos");
      setAdding(false);
      return;
    }

    for (const item of items) {
      const product = products.find((p: any) => p.id === item.product_id);
      if (!product) continue;
      
      const p = { ...product, category_name: (product as any).categories?.name ?? null } as any;
      const variant = item.variant_hex ? {
        name: item.variant_name || "",
        hex: item.variant_hex,
        price: item.price,
        image: item.variant_image,
      } : undefined;

      for (let i = 0; i < item.quantity; i++) {
        addToCart(p, undefined, variant);
      }
    }

    // Mark as completed
    await supabase.from("shared_carts").update({ status: "completed" } as any).eq("id", id);

    // Store payment method restriction for checkout
    if (paymentMethod) {
      sessionStorage.setItem("shared_cart_payment_method", paymentMethod);
    } else {
      sessionStorage.removeItem("shared_cart_payment_method");
    }

    toast.success("Produtos adicionados ao carrinho!");
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!cart) return null;

  const items = cart.items as SharedCartItem[];
  const total = items.reduce((s: number, i: SharedCartItem) => s + i.price * i.quantity, 0);
  const paymentMethod = (cart as any).payment_method as string | null;
  const payLabel = paymentMethod === "pix" ? "PIX" : paymentMethod === "card" ? "Cartão" : null;

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <CartDrawer />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading font-black text-2xl">Carrinho Montado para Você</h1>
          {cart.customer_name && (
            <p className="text-muted-foreground mt-1">Olá, {cart.customer_name}! 👋</p>
          )}
          {cart.notes && (
            <p className="text-sm text-muted-foreground mt-2 bg-muted rounded-xl px-4 py-2 inline-block">{cart.notes}</p>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          {items.map((item: SharedCartItem, idx: number) => (
            <div key={idx} className="flex gap-4 items-center py-3 border-b border-border/50 last:border-0">
              <img src={item.image || "/placeholder.svg"} alt={item.product_name} className="w-16 h-16 rounded-xl object-cover border border-border" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{item.product_name}</h3>
                {item.variant_name && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: item.variant_hex }} />
                    <span className="text-xs text-muted-foreground">{item.variant_name}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">Qtd: {item.quantity}</p>
              </div>
              <p className="font-bold text-sm">{fmt(item.price * item.quantity)}</p>
            </div>
          ))}

          <div className="pt-3 border-t border-border flex justify-between items-baseline">
            <span className="text-muted-foreground">Total</span>
            <span className="text-2xl font-black">{fmt(total)}</span>
          </div>

          {payLabel && (
            <div className="flex items-center justify-center gap-2 py-2 bg-muted/50 rounded-xl text-sm">
              {paymentMethod === "pix" ? <QrCode className="w-4 h-4 text-primary" /> : <CreditCard className="w-4 h-4 text-primary" />}
              <span className="font-semibold">Pagamento via {payLabel}</span>
            </div>
          )}

          <button
            onClick={handleAddAllToCart}
            disabled={adding}
            className="w-full bg-foreground text-background py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 mt-4"
          >
            <ShoppingCart className="w-5 h-5" />
            {adding ? "Adicionando..." : "Adicionar Tudo ao Carrinho"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
