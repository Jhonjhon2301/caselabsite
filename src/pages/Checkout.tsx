import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Loader2, QrCode, ShieldCheck, Truck, Trash2, Minus, Plus, Tag, Package } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import SEOHead from "@/components/SEOHead";
import { trackInitiateCheckout } from "@/lib/tracking";

type PaymentMethod = "card" | "pix";

interface ShippingInfo {
  shipping_cost: number;
  shipping_original_cost: number;
  shipping_carrier: string;
  shipping_service: string;
  shipping_estimated_days: number;
  is_free_shipping: boolean;
  free_shipping_message: string;
  uf: string;
}

export default function Checkout() {
  const { items, totalPrice, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({ active_gateway: "mercadopago", pix_enabled: true, card_enabled: true });
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    cpf: "",
    cep: "",
    address: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (items.length === 0) navigate("/");
    else if (!user) {
      toast.error("Faça login para finalizar a compra");
      navigate("/auth");
    } else {
      trackInitiateCheckout(
        items.map(i => ({ id: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity })),
        totalPrice
      );
      // Auto-fill from profile
      supabase
        .from("profiles")
        .select("full_name, email, phone, cpf")
        .eq("user_id", user.id)
        .single()
        .then(({ data: profile }) => {
          if (profile) {
            setForm(prev => ({
              ...prev,
              name: profile.full_name || prev.name,
              email: profile.email || user.email || prev.email,
              phone: profile.phone || prev.phone,
              cpf: profile.cpf || prev.cpf,
            }));
          }
        });
    }
  }, [items.length, navigate, user]);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_config")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as any;
          setPaymentConfig((prev) => ({ ...prev, ...v }));
          if (!v.pix_enabled && v.card_enabled) setPaymentMethod("card");
        }
      });
  }, []);

  // Recalculate shipping when subtotal changes (e.g. quantity change)
  useEffect(() => {
    if (shippingInfo && form.cep.replace(/\D/g, "").length === 8) {
      calculateShipping(form.cep);
    }
  }, [totalPrice]);

  if (items.length === 0) return null;

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const shippingCost = shippingInfo?.shipping_cost ?? 0;
  const finalTotal = Math.max(0, totalPrice - couponDiscount + shippingCost);

  const formatCPF = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const formatCEP = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
  };

  const calculateShipping = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCalculatingShipping(true);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-shipping", {
        body: { cep: digits, subtotal: totalPrice, totalQuantity: items.reduce((s, i) => s + i.quantity, 0) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setShippingInfo(data as ShippingInfo);
    } catch (err: any) {
      console.error("Shipping error:", err);
      setShippingInfo(null);
      toast.error("Não foi possível calcular o frete. Tente novamente.");
    } finally {
      setCalculatingShipping(false);
    }
  };

  const fetchAddress = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          address: data.logradouro || prev.address,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
        }));
      }
    } catch {}
    // Also calculate shipping
    calculateShipping(cep);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (!data) { toast.error("Cupom inválido ou expirado"); return; }
      if (data.min_order_value && totalPrice < data.min_order_value) { toast.error(`Pedido mínimo de ${fmt(data.min_order_value)} para este cupom`); return; }
      if (data.max_uses && data.current_uses >= data.max_uses) { toast.error("Cupom esgotado"); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error("Cupom expirado"); return; }

      const discount = data.discount_type === "percentage" ? (totalPrice * data.discount_value) / 100 : data.discount_value;
      setCouponDiscount(discount);
      setCouponApplied(true);
      toast.success(`Cupom aplicado! Desconto de ${fmt(discount)}`);
    } catch { toast.error("Erro ao aplicar cupom"); } finally { setApplyingCoupon(false); }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Informe seu nome";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "E-mail inválido";
    if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Telefone inválido";
    if (form.cpf.replace(/\D/g, "").length !== 11) e.cpf = "CPF inválido";
    if (form.cep.replace(/\D/g, "").length !== 8) e.cep = "CEP inválido";
    if (!form.address.trim()) e.address = "Informe o endereço";
    if (!form.number.trim()) e.number = "Informe o número";
    if (!form.neighborhood.trim()) e.neighborhood = "Informe o bairro";
    if (!form.city.trim()) e.city = "Informe a cidade";
    if (!form.state.trim()) e.state = "Informe o estado";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildBody = () => ({
    items: items.map((i) => ({
      product_id: i.product.id,
      name: i.product.name + (i.customName ? ` (Nome: ${i.customName})` : ""),
      price: i.product.price,
      quantity: i.quantity,
      image: i.product.images?.[0] || null,
    })),
    customer: {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      cpf: form.cpf.trim(),
    },
    shipping: {
      cep: form.cep.trim(),
      address: form.address.trim(),
      number: form.number.trim(),
      complement: form.complement.trim(),
      neighborhood: form.neighborhood.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      cost: shippingCost,
      original_cost: shippingInfo?.shipping_original_cost ?? 0,
      carrier: shippingInfo?.shipping_carrier ?? "",
      service: shippingInfo?.shipping_service ?? "",
      estimated_days: shippingInfo?.shipping_estimated_days ?? 0,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Preencha todos os campos obrigatórios");
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const el = document.querySelector(`[name="${firstErrorKey}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (!shippingInfo) {
      toast.error("Informe seu CEP para calcular o frete");
      return;
    }
    setLoading(true);
    try {
      if (paymentMethod === "pix") {
        // PIX manual: cria pedido no banco e envia via WhatsApp
        // 1. Criar pedido no banco
        const { data: order, error: orderErr } = await supabase.from("orders").insert({
          user_id: user!.id,
          customer_name: form.name.trim(),
          customer_email: form.email.trim(),
          customer_phone: form.phone.trim(),
          customer_cpf: form.cpf.trim(),
          subtotal: totalPrice,
          discount: couponDiscount,
          shipping_cost: shippingCost,
          shipping_original_cost: shippingInfo.shipping_original_cost,
          shipping_carrier: shippingInfo.shipping_carrier,
          shipping_service: shippingInfo.shipping_service,
          shipping_estimated_days: shippingInfo.shipping_estimated_days,
          shipping_cep: form.cep.replace(/\D/g, ""),
          shipping_address: form.address.trim(),
          shipping_number: form.number.trim(),
          shipping_complement: form.complement.trim(),
          shipping_neighborhood: form.neighborhood.trim(),
          shipping_city: form.city.trim(),
          shipping_state: form.state.trim(),
          total: finalTotal,
          status: "pending",
          payment_status: "pending",
          notes: [
            "Pagamento via PIX (WhatsApp)",
            ...items.filter(i => i.customName).map(i => `Personalização "${i.product.name}": ${i.customName}`),
          ].join(" | "),
        }).select().single();

        if (orderErr || !order) throw new Error("Erro ao criar pedido");

        // 2. Criar itens do pedido
        await supabase.from("order_items").insert(
          items.map(i => ({
            order_id: order.id,
            product_id: i.product.id,
            product_name: i.product.name + (i.customName ? ` (Nome: ${i.customName})` : ""),
            quantity: i.quantity,
            unit_price: i.product.price,
          }))
        );

        // 3. Enviar mensagem WhatsApp
        const itemsList = items.map(i => `• ${i.quantity}x ${i.product.name}${i.customName ? ` ✏️ Nome: ${i.customName}` : ""} — ${fmt(i.product.price)}`).join("\n");
        const message = [
          "🛒 *Novo Pedido via PIX — Case Lab*",
          `📋 Pedido: #${order.id.slice(0, 8)}`,
          "",
          `👤 *Cliente:* ${form.name.trim()}`,
          `📧 ${form.email.trim()}`,
          `📱 ${form.phone.trim()}`,
          `📋 CPF: ${form.cpf.trim()}`,
          "",
          "📦 *Itens:*",
          itemsList,
          "",
          `💰 Subtotal: ${fmt(totalPrice)}`,
          couponDiscount > 0 ? `🏷️ Desconto: -${fmt(couponDiscount)}` : "",
          `🚚 Frete (${shippingInfo.shipping_carrier} ${shippingInfo.shipping_service}): ${shippingInfo.is_free_shipping ? "Grátis" : fmt(shippingCost)}`,
          `✅ *Total: ${fmt(finalTotal)}*`,
          "",
          "📍 *Endereço:*",
          `${form.address.trim()}, ${form.number.trim()}${form.complement.trim() ? ` - ${form.complement.trim()}` : ""}`,
          `${form.neighborhood.trim()}, ${form.city.trim()} - ${form.state.trim()}`,
          `CEP: ${form.cep.trim()}`,
          "",
          `⏰ Entrega estimada: ${shippingInfo.shipping_estimated_days} dias úteis`,
        ].filter(Boolean).join("\n");

        const whatsappUrl = `https://wa.me/5561992629861?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
        clearCart();
        toast.success("Pedido criado! Finalize o pagamento via PIX no WhatsApp.");
        navigate("/meus-pedidos");
      } else {
        // Cartão: Stripe checkout
        const { data, error } = await supabase.functions.invoke("create-checkout", { body: buildBody() });
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, "_blank");
          clearCart();
          toast.success("Redirecionando para pagamento em nova aba...");
          navigate("/");
        } else {
          throw new Error("URL de pagamento não retornada");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary/30 outline-none transition-all";

  return (
    <div className="min-h-screen bg-muted/30">
      <SEOHead title="Finalizar Compra" description="Complete seu pedido na Case Lab." />
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <img src={logo} alt="Case Lab" className="h-8 w-8 rounded-full object-cover" />
          <h1 className="font-heading font-bold text-lg">Finalizar Compra</h1>
        </div>
      </div>

      {/* Trust bar */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-6 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Compra Segura</span>
          <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-primary" /> Frete Grátis p/ DF +R$150</span>
          <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-primary" /> Pagamento Seguro</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Personal info */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-heading font-bold text-base mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
                Dados Pessoais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Nome Completo</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Seu nome completo" />
                  {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="seu@email.com" />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Telefone / WhatsApp</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} className={inputClass} placeholder="(61) 99999-9999" />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">CPF</label>
                  <input type="text" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })} className={inputClass} placeholder="000.000.000-00" />
                  {errors.cpf && <p className="text-xs text-destructive mt-1">{errors.cpf}</p>}
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-heading font-bold text-base mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
                Endereço de Entrega
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">CEP</label>
                  <input
                    type="text"
                    value={form.cep}
                    onChange={(e) => {
                      const v = formatCEP(e.target.value);
                      setForm({ ...form, cep: v });
                      if (v.replace(/\D/g, "").length === 8) fetchAddress(v);
                    }}
                    className={inputClass}
                    placeholder="00000-000"
                  />
                  {errors.cep && <p className="text-xs text-destructive mt-1">{errors.cep}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Endereço</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} placeholder="Rua, Avenida..." />
                  {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Número</label>
                  <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className={inputClass} placeholder="123" />
                  {errors.number && <p className="text-xs text-destructive mt-1">{errors.number}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Complemento</label>
                  <input type="text" value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} className={inputClass} placeholder="Apto, Bloco..." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Bairro</label>
                  <input type="text" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className={inputClass} placeholder="Seu bairro" />
                  {errors.neighborhood && <p className="text-xs text-destructive mt-1">{errors.neighborhood}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Cidade</label>
                  <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} placeholder="Sua cidade" />
                  {errors.city && <p className="text-xs text-destructive mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Estado</label>
                  <input type="text" maxLength={2} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} className={inputClass} placeholder="UF" />
                  {errors.state && <p className="text-xs text-destructive mt-1">{errors.state}</p>}
                </div>
              </div>

              {/* Shipping result */}
              {calculatingShipping && (
                <div className="mt-4 p-4 bg-muted/50 rounded-xl flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Calculando frete...</span>
                </div>
              )}
              {shippingInfo && !calculatingShipping && (
                <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{shippingInfo.shipping_carrier} — {shippingInfo.shipping_service}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Entrega em até {shippingInfo.shipping_estimated_days} dias úteis
                    </span>
                    <span className="font-bold">
                      {shippingInfo.is_free_shipping ? (
                        <span className="text-primary">Grátis</span>
                      ) : (
                        fmt(shippingInfo.shipping_cost)
                      )}
                    </span>
                  </div>
                  {shippingInfo.is_free_shipping && shippingInfo.shipping_original_cost > 0 && (
                    <p className="text-xs text-muted-foreground line-through">
                      Valor original: {fmt(shippingInfo.shipping_original_cost)}
                    </p>
                  )}
                  <p className={`text-xs font-semibold mt-1 ${shippingInfo.is_free_shipping ? "text-primary" : "text-accent-foreground"}`}>
                    {shippingInfo.free_shipping_message}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-heading font-bold text-base mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</span>
                Forma de Pagamento
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === "pix" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <QrCode className={`w-7 h-7 ${paymentMethod === "pix" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-bold text-sm ${paymentMethod === "pix" ? "text-primary" : "text-foreground"}`}>Pix</span>
                  <span className="text-[10px] text-muted-foreground">Pagamento instantâneo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === "card" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <CreditCard className={`w-7 h-7 ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-bold text-sm ${paymentMethod === "card" ? "text-primary" : "text-foreground"}`}>Cartão</span>
                  <span className="text-[10px] text-muted-foreground">Crédito ou débito</span>
                </button>
              </div>
            </div>
          </div>

          {/* Order summary sidebar */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-4">
              <h2 className="font-heading font-bold text-base mb-4">Resumo do Pedido</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {items.map(({ product, quantity, customName }, idx) => (
                  <div key={`${product.id}-${idx}`} className="flex gap-3">
                    <img src={product.images?.[0] || "/placeholder.svg"} alt={product.name} className="w-14 h-14 rounded-lg object-cover border border-border" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold truncate">{product.name}</h4>
                      {customName && <p className="text-[10px] text-primary">✏️ Nome: {customName}</p>}
                      <p className="text-xs text-muted-foreground">{fmt(product.price)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} className="p-0.5 hover:bg-muted rounded border border-border"><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-bold w-5 text-center">{quantity}</span>
                        <button type="button" onClick={() => updateQuantity(product.id, quantity + 1)} className="p-0.5 hover:bg-muted rounded border border-border"><Plus className="w-3 h-3" /></button>
                        <button type="button" onClick={() => removeFromCart(product.id)} className="ml-auto p-0.5 text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="border-t border-border pt-3 mb-3">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Cupom de desconto</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    disabled={couponApplied}
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-xs focus:ring-2 focus:ring-primary/30 outline-none disabled:opacity-50"
                    placeholder="CÓDIGO"
                  />
                  <button
                    type="button"
                    onClick={couponApplied ? () => { setCouponApplied(false); setCouponDiscount(0); setCouponCode(""); } : applyCoupon}
                    disabled={applyingCoupon}
                    className="px-3 py-2 rounded-lg bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {applyingCoupon ? "..." : couponApplied ? "Remover" : "Aplicar"}
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-[10px] text-primary font-semibold mt-1 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Desconto de {fmt(couponDiscount)} aplicado
                  </p>
                )}
              </div>

              {/* Totals */}
              <div className="border-t border-border pt-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{fmt(totalPrice)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Desconto</span>
                    <span>-{fmt(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="font-semibold">
                    {calculatingShipping ? (
                      <Loader2 className="w-3 h-3 animate-spin inline" />
                    ) : shippingInfo ? (
                      shippingInfo.is_free_shipping ? (
                        <span className="text-primary">Grátis</span>
                      ) : (
                        fmt(shippingInfo.shipping_cost)
                      )
                    ) : (
                      <span className="text-muted-foreground">Informe o CEP</span>
                    )}
                  </span>
                </div>
                {shippingInfo && !shippingInfo.is_free_shipping && (
                  <p className="text-[10px] text-muted-foreground">
                    {shippingInfo.free_shipping_message}
                  </p>
                )}
                <div className="flex justify-between text-lg font-black pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{fmt(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !shippingInfo}
                className="w-full mt-5 gradient-brand text-primary-foreground py-4 rounded-xl font-bold text-sm tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : paymentMethod === "pix" ? (
                  <QrCode className="w-4 h-4" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {loading ? "PROCESSANDO..." : paymentMethod === "pix" ? "PAGAR COM PIX" : "PAGAR COM CARTÃO"}
              </button>

              <p className="text-[10px] text-muted-foreground text-center mt-2.5">
                {paymentMethod === "pix" ? "Pedido via WhatsApp + PIX manual 🔒" : "Pagamento seguro 🔒"}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
