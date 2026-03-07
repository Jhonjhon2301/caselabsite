import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Minus, Trash2, Send, Copy, ShoppingCart, Search, Package, CreditCard, QrCode } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logAudit } from "@/lib/audit";
import type { Product, ProductVariant } from "@/types/product";

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

interface SharedCart {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  items: SharedCartItem[];
  notes: string | null;
  total: number;
  status: string;
  payment_method: string | null;
  created_at: string;
}

export default function AdminSharedCart() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cartItems, setCartItems] = useState<SharedCartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "">("");
  const [saving, setSaving] = useState(false);
  const [savedCarts, setSavedCarts] = useState<SharedCart[]>([]);
  const [loadingCarts, setLoadingCarts] = useState(true);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  useEffect(() => {
    supabase.from("products").select("*, categories(name)").eq("is_active", true).order("name")
      .then(({ data }) => {
        if (data) setProducts(data.map((p: any) => ({ ...p, category_name: p.categories?.name ?? null })) as Product[]);
      });
    loadSavedCarts();
  }, []);

  const loadSavedCarts = async () => {
    setLoadingCarts(true);
    const { data } = await supabase.from("shared_carts").select("*").order("created_at", { ascending: false }).limit(50);
    if (data) setSavedCarts(data as any as SharedCart[]);
    setLoadingCarts(false);
  };

  const addProduct = (product: Product, variant?: ProductVariant) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product_id === product.id && (i.variant_hex || "") === (variant?.hex || ""));
      if (existing) {
        return prev.map(i =>
          i.product_id === product.id && (i.variant_hex || "") === (variant?.hex || "")
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        variant_name: variant?.name,
        variant_hex: variant?.hex,
        variant_image: variant?.image,
        price: variant?.price ?? product.price,
        quantity: 1,
        image: variant?.image || product.images?.[0] || undefined,
      }];
    });
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter((_, i) => i !== idx));
    } else {
      setCartItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
    }
  };

  const removeItem = (idx: number) => setCartItems(prev => prev.filter((_, i) => i !== idx));

  const total = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  const saveCart = async () => {
    if (cartItems.length === 0) { toast.error("Adicione pelo menos um produto"); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.from("shared_carts").insert({
        created_by: user!.id,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        items: cartItems as any,
        notes: notes || null,
        total,
        status: "pending",
        payment_method: paymentMethod || null,
      } as any).select().single();

      if (error) throw error;

      await logAudit("create", "shared_cart", (data as any).id, { items: cartItems.length, total, payment_method: paymentMethod });
      toast.success("Carrinho criado com sucesso!");
      
      const link = `${window.location.origin}/carrinho/${(data as any).id}`;
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado para a área de transferência!");

      setCartItems([]);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setNotes("");
      setPaymentMethod("");
      loadSavedCarts();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar carrinho");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/carrinho/${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const sendWhatsApp = (cart: SharedCart) => {
    const items = (cart.items as SharedCartItem[]);
    const itemsList = items.map(i => `• ${i.quantity}x ${i.product_name}${i.variant_name ? ` (${i.variant_name})` : ""} — ${fmt(i.price)}`).join("\n");
    const link = `${window.location.origin}/carrinho/${cart.id}`;
    const payLabel = cart.payment_method === "pix" ? "PIX" : cart.payment_method === "card" ? "Cartão" : "PIX ou Cartão";
    const message = [
      "🛒 *Carrinho Montado — Case Lab*",
      "",
      cart.customer_name ? `Olá ${cart.customer_name}! 👋` : "Olá! 👋",
      "",
      "Montamos um carrinho especial para você:",
      "",
      itemsList,
      "",
      `💰 *Total: ${fmt(cart.total)}*`,
      `💳 *Pagamento: ${payLabel}*`,
      "",
      `🔗 Finalize sua compra aqui: ${link}`,
      "",
      cart.notes ? `📝 ${cart.notes}` : "",
    ].filter(Boolean).join("\n");

    const phone = cart.customer_phone?.replace(/\D/g, "") || "";
    const url = `https://wa.me/${phone ? `55${phone}` : ""}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Montar Carrinho para Cliente</h1>
        <p className="text-sm text-muted-foreground mt-1">Monte um carrinho e envie o link para o cliente finalizar a compra</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Selector */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-base flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Selecionar Produtos
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 outline-none"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {filteredProducts.map(product => {
              const variants: ProductVariant[] = (product.variants as ProductVariant[]) ?? [];
              return (
                <div key={product.id} className="border border-border rounded-xl p-3">
                  <div className="flex gap-3 items-center">
                    <img src={product.images?.[0] || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{fmt(product.price)}</p>
                    </div>
                    {variants.length === 0 && (
                      <button onClick={() => addProduct(product)} className="p-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {variants.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {variants.map((v, vi) => (
                        <button
                          key={vi}
                          onClick={() => addProduct(product, v)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-xs"
                        >
                          <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: v.hex }} />
                          <span>{v.name}</span>
                          <Plus className="w-3 h-3 text-primary" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Cart Builder */}
        <div className="space-y-4">
          {/* Customer info */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-bold text-base">Dados do Cliente (opcional)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome do cliente" className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="WhatsApp" className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
              <input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="E-mail" className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 outline-none sm:col-span-2" />
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações para o cliente..." rows={2} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-none" />
            
            {/* Payment method selection */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Forma de Pagamento</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs ${
                    paymentMethod === "pix" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <QrCode className={`w-5 h-5 ${paymentMethod === "pix" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-bold">Somente PIX</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs ${
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <CreditCard className={`w-5 h-5 ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-bold">Somente Cartão</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("")}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs ${
                    paymentMethod === "" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <ShoppingCart className={`w-5 h-5 ${paymentMethod === "" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="font-bold">Ambos</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cart items */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-bold text-base flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Carrinho ({cartItems.length} {cartItems.length === 1 ? "item" : "itens"})
            </h2>
            {cartItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Selecione produtos ao lado para montar o carrinho</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-muted/50 rounded-xl p-2.5">
                    <img src={item.image || "/placeholder.svg"} alt="" className="w-11 h-11 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{item.product_name}</p>
                      {item.variant_name && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.variant_hex }} />
                          <span className="text-[10px] text-muted-foreground">{item.variant_name}</span>
                        </div>
                      )}
                      <p className="text-xs font-bold text-primary">{fmt(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(idx, item.quantity - 1)} className="p-1 hover:bg-muted rounded border border-border"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(idx, item.quantity + 1)} className="p-1 hover:bg-muted rounded border border-border"><Plus className="w-3 h-3" /></button>
                      <button onClick={() => removeItem(idx)} className="p-1 text-destructive hover:bg-destructive/10 rounded ml-1"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {cartItems.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-black">{fmt(total)}</span>
                </div>
                <button
                  onClick={saveCart}
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {saving ? "Salvando..." : "Criar Carrinho e Copiar Link"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Carts */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-bold text-base mb-4">Carrinhos Enviados</h2>
        {loadingCarts ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : savedCarts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum carrinho criado ainda</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-semibold text-muted-foreground">Cliente</th>
                  <th className="pb-2 font-semibold text-muted-foreground">Itens</th>
                  <th className="pb-2 font-semibold text-muted-foreground">Total</th>
                  <th className="pb-2 font-semibold text-muted-foreground">Pagamento</th>
                  <th className="pb-2 font-semibold text-muted-foreground">Status</th>
                  <th className="pb-2 font-semibold text-muted-foreground">Data</th>
                  <th className="pb-2 font-semibold text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {savedCarts.map(cart => (
                  <tr key={cart.id} className="border-b border-border/50">
                    <td className="py-2.5">{cart.customer_name || "—"}</td>
                    <td className="py-2.5">{(cart.items as SharedCartItem[]).reduce((s, i) => s + i.quantity, 0)} itens</td>
                    <td className="py-2.5 font-bold">{fmt(cart.total)}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cart.payment_method === "pix" ? "bg-green-100 text-green-700" :
                        cart.payment_method === "card" ? "bg-blue-100 text-blue-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {cart.payment_method === "pix" ? "PIX" : cart.payment_method === "card" ? "Cartão" : "Ambos"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cart.status === "completed" ? "bg-primary/10 text-primary" :
                        cart.status === "viewed" ? "bg-accent text-accent-foreground" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {cart.status === "completed" ? "Finalizado" : cart.status === "viewed" ? "Visualizado" : "Pendente"}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{new Date(cart.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => copyLink(cart.id)} className="p-1.5 hover:bg-muted rounded-lg transition-colors" title="Copiar link">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {cart.customer_phone && (
                          <button onClick={() => sendWhatsApp(cart)} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-primary" title="Enviar via WhatsApp">
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
