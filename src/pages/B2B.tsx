import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Building2, Calculator, ShoppingCart, Send, Package } from "lucide-react";

interface VolumeDiscount {
  id: string;
  min_quantity: number;
  max_quantity: number | null;
  discount_percent: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  is_active: boolean;
}

export default function B2B() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [discounts, setDiscounts] = useState<VolumeDiscount[]>([]);
  const [b2bProfile, setB2bProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Registration form
  const [showRegister, setShowRegister] = useState(false);
  const [form, setForm] = useState({ company_name: "", cnpj: "", contact_name: "", contact_phone: "", contact_email: "" });

  // Simulator
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(10);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, d] = await Promise.all([
        supabase.from("products").select("id, name, price, images, is_active").eq("is_active", true),
        supabase.from("volume_discounts").select("*").order("min_quantity"),
      ]);
      setProducts(p.data || []);
      setDiscounts((d.data as VolumeDiscount[]) || []);

      if (user) {
        const { data } = await supabase.from("b2b_customers").select("*").eq("user_id", user.id).maybeSingle();
        setB2bProfile(data);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const getDiscount = (quantity: number) => {
    const tier = discounts.find(d => quantity >= d.min_quantity && (d.max_quantity === null || quantity <= d.max_quantity));
    return tier?.discount_percent || 0;
  };

  const simProduct = products.find(p => p.id === selectedProduct);
  const simDiscount = getDiscount(qty);
  const simUnitPrice = simProduct ? simProduct.price * (1 - simDiscount / 100) : 0;
  const simTotal = simUnitPrice * qty;

  const handleRegister = async () => {
    if (!user) { toast.error("Faça login primeiro"); return; }
    if (!form.company_name) { toast.error("Nome da empresa é obrigatório"); return; }
    const { error } = await supabase.from("b2b_customers").insert({
      user_id: user.id,
      ...form,
    });
    if (error) toast.error("Erro ao cadastrar");
    else {
      toast.success("Cadastro enviado! Aguarde aprovação.");
      setShowRegister(false);
      const { data } = await supabase.from("b2b_customers").select("*").eq("user_id", user.id).maybeSingle();
      setB2bProfile(data);
    }
  };

  const handleQuote = async () => {
    if (!b2bProfile?.is_approved) { toast.error("Seu cadastro B2B precisa ser aprovado"); return; }
    if (!selectedProduct || qty < 1) { toast.error("Selecione produto e quantidade"); return; }
    const { error } = await supabase.from("b2b_quotes").insert({
      b2b_customer_id: b2bProfile.id,
      items: [{ product_id: selectedProduct, product_name: simProduct?.name, quantity: qty, unit_price: simUnitPrice }],
      subtotal: simProduct!.price * qty,
      discount: (simProduct!.price * qty) - simTotal,
      total: simTotal,
      notes: `Pedido de ${qty} unidades de ${simProduct?.name}`,
    });
    if (error) toast.error("Erro ao enviar orçamento");
    else toast.success("Orçamento enviado com sucesso!");
  };

  const inputClass = "w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Área B2B — Atacado</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Compre em quantidade com preços especiais. Ideal para empresas, eventos e brindes corporativos.
          </p>
        </div>

        {/* Volume Discount Table */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Tabela de Descontos por Volume
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {discounts.map(d => (
              <div key={d.id} className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{d.discount_percent}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {d.min_quantity}{d.max_quantity ? ` - ${d.max_quantity}` : "+"} unidades
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Price Simulator */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-heading text-lg font-bold mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" /> Simulador de Preço por Volume
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Produto</label>
              <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className={inputClass}>
                <option value="">Selecione...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} — R$ {p.price.toFixed(2).replace(".", ",")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Quantidade</label>
              <input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} className={inputClass} />
            </div>
            <div className="flex flex-col justify-end">
              {simProduct && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Desconto: <span className="font-bold text-primary">{simDiscount}%</span></p>
                  <p className="text-xs text-muted-foreground">Unitário: R$ {simUnitPrice.toFixed(2).replace(".", ",")}</p>
                  <p className="text-lg font-bold text-primary">Total: R$ {simTotal.toFixed(2).replace(".", ",")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* B2B Profile / Register */}
        {!user ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Faça login para acessar a área B2B completa</p>
            <a href="/auth" className="inline-flex px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Entrar / Cadastrar
            </a>
          </div>
        ) : b2bProfile ? (
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-heading text-lg font-bold mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Seu Perfil B2B
            </h2>
            <p className="text-sm"><strong>Empresa:</strong> {b2bProfile.company_name}</p>
            <p className="text-sm"><strong>Status:</strong>{" "}
              <span className={`font-medium ${b2bProfile.is_approved ? "text-emerald-600" : "text-amber-600"}`}>
                {b2bProfile.is_approved ? "Aprovado" : "Aguardando aprovação"}
              </span>
            </p>
            <p className="text-sm"><strong>Desconto especial:</strong> {b2bProfile.discount_percent}%</p>
            {b2bProfile.is_approved && simProduct && (
              <button onClick={handleQuote} className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                <Send className="w-4 h-4" /> Solicitar Orçamento
              </button>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6">
            {showRegister ? (
              <>
                <h2 className="font-heading text-lg font-bold mb-4">Cadastro B2B</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input placeholder="Nome da Empresa *" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className={inputClass} />
                  <input placeholder="CNPJ" value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} className={inputClass} />
                  <input placeholder="Nome do Contato" value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className={inputClass} />
                  <input placeholder="Telefone" value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} className={inputClass} />
                  <input placeholder="Email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className={inputClass} />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={handleRegister} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                    Enviar Cadastro
                  </button>
                  <button onClick={() => setShowRegister(false)} className="px-6 py-2.5 rounded-lg border border-input text-sm hover:bg-muted transition-colors">
                    Cancelar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Você ainda não tem um perfil B2B</p>
                <button onClick={() => setShowRegister(true)} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Cadastrar como B2B
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
