import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, ChevronDown, ChevronUp, ArrowLeft, Truck, Clock, CheckCircle2, XCircle, Paintbrush, ShoppingBag } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; step: number }> = {
  pending: { label: "Pendente", icon: Clock, color: "text-yellow-500", step: 0 },
  confirmed: { label: "Confirmado", icon: CheckCircle2, color: "text-blue-500", step: 1 },
  processing: { label: "Em Produção", icon: Paintbrush, color: "text-purple-500", step: 2 },
  shipped: { label: "Enviado", icon: Truck, color: "text-indigo-500", step: 3 },
  delivered: { label: "Entregue", icon: CheckCircle2, color: "text-green-500", step: 4 },
  cancelled: { label: "Cancelado", icon: XCircle, color: "text-red-500", step: -1 },
};

const STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function MyOrders() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, any[]>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const toggleExpand = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    setExpandedOrder(orderId);
    if (!orderItems[orderId]) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      setOrderItems(prev => ({ ...prev, [orderId]: data ?? [] }));
    }
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
          <p className="text-muted-foreground text-center py-16">Carregando...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Você ainda não tem pedidos</p>
            <button onClick={() => navigate("/")} className="mt-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold">
              Comprar agora
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConf.icon;
              const currentStep = statusConf.step;

              return (
                <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <button onClick={() => toggleExpand(order.id)} className="w-full p-4 flex items-center gap-3 text-left">
                    <div className={`p-2 rounded-lg bg-muted ${statusConf.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                        <span className={`text-xs font-semibold ${statusConf.color}`}>{statusConf.label}</span>
                      </div>
                      <p className="text-sm font-medium">{fmt(order.total)}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                    </div>
                    {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {expandedOrder === order.id && (
                    <div className="border-t border-border p-4 space-y-4">
                      {/* Status Timeline */}
                      {order.status !== "cancelled" && (
                        <div className="flex items-center gap-0">
                          {STEPS.map((step, i) => {
                            const active = i <= currentStep;
                            const conf = STATUS_CONFIG[step];
                            return (
                              <div key={step} className="flex items-center flex-1 last:flex-none">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}>
                                  {i + 1}
                                </div>
                                {i < STEPS.length - 1 && (
                                  <div className={`h-0.5 flex-1 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        {STEPS.map(s => <span key={s} className="text-center">{STATUS_CONFIG[s].label}</span>)}
                      </div>

                      {/* Tracking code */}
                      {order.tracking_code && (
                        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                          <Truck className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <p className="text-xs font-semibold">Código de Rastreio</p>
                            <p className="text-sm font-mono">{order.tracking_code}</p>
                          </div>
                          {order.tracking_url && (
                            <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-primary font-semibold hover:underline">
                              Rastrear
                            </a>
                          )}
                        </div>
                      )}

                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold mb-2">Itens</p>
                        {orderItems[order.id]?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                            <span>{item.quantity}x {item.product_name}</span>
                            <span className="font-medium">{fmt(item.unit_price * item.quantity)}</span>
                          </div>
                        )) ?? <p className="text-xs text-muted-foreground">Carregando...</p>}
                      </div>

                      {/* Summary */}
                      <div className="text-sm space-y-1 pt-2 border-t border-border">
                        <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                        {Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Desconto</span><span>-{fmt(order.discount)}</span></div>}
                        {Number(order.shipping_cost) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>{fmt(order.shipping_cost)}</span></div>}
                        <div className="flex justify-between font-bold text-base pt-1"><span>Total</span><span>{fmt(order.total)}</span></div>
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
