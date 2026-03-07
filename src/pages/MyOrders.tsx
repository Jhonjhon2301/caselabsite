import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, ChevronDown, ChevronUp, ArrowLeft, Truck, Clock, CheckCircle2, XCircle, Paintbrush, ShoppingBag, MapPin, CreditCard, Copy, ExternalLink, Loader2, FileText } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useToast } from "@/hooks/use-toast";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string; step: number }> = {
  pending: { label: "Pendente", icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", step: 0 },
  confirmed: { label: "Confirmado", icon: CheckCircle2, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", step: 1 },
  processing: { label: "Em Produção", icon: Paintbrush, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", step: 2 },
  shipped: { label: "Enviado", icon: Truck, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/30", step: 3 },
  delivered: { label: "Entregue", icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", step: 4 },
  cancelled: { label: "Cancelado", icon: XCircle, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", step: -1 },
  canceled: { label: "Cancelado", icon: XCircle, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", step: -1 },
};

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando", color: "text-yellow-600" },
  paid: { label: "Pago", color: "text-green-600" },
  failed: { label: "Falhou", color: "text-red-600" },
  refunded: { label: "Reembolsado", color: "text-blue-600" },
};

export default function MyOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);
  const [fiscalNotes, setFiscalNotes] = useState<Record<string, any[]>>({});

  const handleRetryPayment = async (orderId: string) => {
    setRetryingPayment(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("retry-payment", {
        body: { order_id: orderId },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        toast({ title: "Redirecionando", description: "Uma nova aba foi aberta para pagamento." });
      } else {
        throw new Error("URL de pagamento não retornada");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível gerar link de pagamento", variant: "destructive" });
    } finally {
      setRetryingPayment(null);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        if (error) throw error;
        setOrders(data ?? []);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const toggleExpand = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    setExpandedOrder(orderId);
    if (!orderItems[orderId]) {
      try {
        const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
        setOrderItems(prev => ({ ...prev, [orderId]: data ?? [] }));
      } catch (err) {
        console.error("Error fetching order items:", err);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Código copiado para a área de transferência" });
  };

  const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Meus Pedidos" description="Acompanhe seus pedidos na Case Lab" />
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar à loja
        </button>

        <h1 className="font-heading font-bold text-2xl mb-6 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" /> Meus Pedidos
        </h1>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground">Carregando pedidos...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Você ainda não tem pedidos</p>
            <p className="text-sm mt-1">Que tal conferir nossas garrafas personalizadas?</p>
            <button onClick={() => navigate("/")} className="mt-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all">
              Comprar agora
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConf.icon;
              const currentStep = statusConf.step;
              const paymentInfo = PAYMENT_STATUS_LABELS[order.payment_status] || PAYMENT_STATUS_LABELS.pending;

              return (
                <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => toggleExpand(order.id)} className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors">
                    <div className={`p-2.5 rounded-xl ${statusConf.bgColor}`}>
                      <StatusIcon className={`w-5 h-5 ${statusConf.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusConf.bgColor} ${statusConf.color}`}>{statusConf.label}</span>
                        <span className={`text-[10px] font-bold ${paymentInfo.color}`}>• {paymentInfo.label}</span>
                      </div>
                      <p className="text-sm font-bold">{fmt(order.total)}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                    {expandedOrder === order.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {expandedOrder === order.id && (
                    <div className="border-t border-border p-4 space-y-5">
                      {/* Status Timeline */}
                      {order.status !== "cancelled" && order.status !== "canceled" && (
                        <div>
                          <p className="text-xs font-semibold mb-3">Progresso do Pedido</p>
                          <div className="flex items-center gap-0">
                            {STEPS.map((step, i) => {
                              const active = i <= currentStep;
                              return (
                                <div key={step} className="flex items-center flex-1 last:flex-none">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                  }`}>
                                    {i + 1}
                                  </div>
                                  {i < STEPS.length - 1 && (
                                    <div className={`h-0.5 flex-1 transition-colors ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between text-[9px] text-muted-foreground mt-1.5">
                            {STEPS.map(s => <span key={s} className="text-center">{STATUS_CONFIG[s].label}</span>)}
                          </div>
                        </div>
                      )}

                      {/* Tracking code */}
                      {order.tracking_code && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="w-4 h-4 text-primary" />
                            <p className="text-sm font-bold">Código de Rastreio</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono bg-background px-3 py-1.5 rounded-lg border border-border flex-1">
                              {order.tracking_code}
                            </code>
                            <button onClick={() => copyToClipboard(order.tracking_code)} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Copiar">
                              <Copy className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {order.tracking_url && (
                              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted transition-colors" title="Rastrear">
                                <ExternalLink className="w-4 h-4 text-primary" />
                              </a>
                            )}
                          </div>
                          {order.shipping_carrier && (
                            <p className="text-[11px] text-muted-foreground mt-2">
                              Via {order.shipping_carrier} {order.shipping_service ? `• ${order.shipping_service}` : ""}
                              {order.shipping_estimated_days ? ` • Prazo estimado: ${order.shipping_estimated_days} dias úteis` : ""}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Delivery Address */}
                      {order.shipping_address && (
                        <div className="bg-muted/50 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <p className="text-xs font-semibold">Endereço de Entrega</p>
                          </div>
                          <p className="text-sm">
                            {order.shipping_address}{order.shipping_number ? `, ${order.shipping_number}` : ""}
                            {order.shipping_complement ? ` - ${order.shipping_complement}` : ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.shipping_neighborhood ? `${order.shipping_neighborhood} — ` : ""}
                            {order.shipping_city}{order.shipping_state ? `/${order.shipping_state}` : ""}
                            {order.shipping_cep ? ` • CEP ${order.shipping_cep}` : ""}
                          </p>
                        </div>
                      )}

                      {/* Payment Info */}
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs font-semibold">Pagamento</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${paymentInfo.color}`}>{paymentInfo.label}</span>
                          {order.customer_cpf && <span className="text-xs text-muted-foreground">CPF: {order.customer_cpf}</span>}
                        </div>
                        {order.payment_status === "pending" && order.status !== "cancelled" && order.status !== "canceled" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRetryPayment(order.id); }}
                            disabled={retryingPayment === order.id}
                            className="mt-3 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50"
                          >
                            {retryingPayment === order.id ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando link...</>
                            ) : (
                              <><CreditCard className="w-4 h-4" /> Pagar agora</>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold mb-2">Itens do Pedido</p>
                        <div className="bg-muted/30 rounded-xl overflow-hidden">
                          {orderItems[order.id]?.map((item: any, idx: number) => (
                            <div key={item.id} className={`flex justify-between text-sm py-3 px-4 ${idx < (orderItems[order.id]?.length || 0) - 1 ? "border-b border-border" : ""}`}>
                              <span className="text-foreground">{item.quantity}x {item.product_name}</span>
                              <span className="font-medium">{fmt(item.unit_price * item.quantity)}</span>
                            </div>
                          )) ?? (
                            <div className="py-4 text-center">
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="text-sm space-y-1.5 pt-3 border-t border-border">
                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                        {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>-{fmt(order.discount)}</span></div>}
                        {Number(order.shipping_cost) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frete</span>
                            <span>{fmt(order.shipping_cost)}</span>
                          </div>
                        )}
                        {Number(order.shipping_cost) === 0 && order.shipping_address && (
                          <div className="flex justify-between text-green-600"><span>Frete</span><span>Grátis!</span></div>
                        )}
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-border"><span>Total</span><span>{fmt(order.total)}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}