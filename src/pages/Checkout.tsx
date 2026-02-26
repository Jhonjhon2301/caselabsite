import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Loader2, QrCode, ShieldCheck, Truck, Trash2, Minus, Plus, Tag } from "lucide-react";
import logo from "@/assets/logo.jpeg";

type PaymentMethod = "card" | "pix";

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
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const finalTotal = Math.max(0, totalPrice - couponDiscount);

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

      if (!data) {
        toast.error("Cupom inválido ou expirado");
        return;
      }

      if (data.min_order_value && totalPrice < data.min_order_value) {
        toast.error(`Pedido mínimo de ${fmt(data.min_order_value)} para este cupom`);
        return;
      }

      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast.error("Cupom esgotado");
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("Cupom expirado");
        return;
      }

      const discount =
        data.discount_type === "percentage"
          ? (totalPrice * data.discount_value) / 100
          : data.discount_value;

      setCouponDiscount(discount);
      setCouponApplied(true);
      toast.success(`Cupom aplicado! Desconto de ${fmt(discount)}`);
    } catch {
      toast.error("Erro ao aplicar cupom");
    } finally {
      setApplyingCoupon(false);
    }
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
      name: i.product.name,
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
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const functionName = paymentMethod === "pix" ? "create-pix-checkout" : "create-checkout";
      const { data, error } = await supabase.functions.invoke(functionName, { body: buildBody() });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        clearCart();
        toast.success("Redirecionando para pagamento em nova aba...");
        navigate("/");
      } else {
        throw new Error("URL de pagamento não retornada");
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
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
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
          <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-primary" /> Frete Grátis +R$299</span>
          <span className="flex items-center gap-1"><CreditCard className="w-3.5 h-3.5 text-primary" /> 3x sem juros</span>
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
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3">
                    <img
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-14 h-14 rounded-lg object-cover border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold truncate">{product.name}</h4>
                      <p className="text-xs text-muted-foreground">{fmt(product.price)}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-0.5 hover:bg-muted rounded border border-border"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="p-0.5 hover:bg-muted rounded border border-border"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="ml-auto p-0.5 text-destructive hover:bg-destructive/10 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="border-t border-border pt-3 mb-3">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Cupom de desconto
                </label>
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
                  <span className="text-primary font-semibold">
                    {totalPrice >= 299.9 ? "Grátis" : "A calcular"}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-black pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{fmt(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
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
                {paymentMethod === "pix" ? "Pagamento via Pix pela Cakto 🔒" : "Pagamento seguro via Stripe 🔒"}
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
