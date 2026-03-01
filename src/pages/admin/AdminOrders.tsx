import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, ChevronDown, ChevronUp, FileText, Receipt, MessageCircle, ExternalLink } from "lucide-react";
import { generateReceiptPdf, generateQuotePdf } from "@/lib/pdf-utils";

interface Order {
  id: string;
  user_id: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  notes: string | null;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_cpf: string | null;
  tracking_code: string | null;
  tracking_url: string | null;
  shipping_address: string | null;
  shipping_number: string | null;
  shipping_complement: string | null;
  shipping_neighborhood: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_cep: string | null;
  shipping_cost: number | null;
  shipping_carrier: string | null;
  shipping_service: string | null;
  profiles?: { full_name: string | null; email: string | null; phone: string | null } | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  { value: "confirmed", label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  { value: "processing", label: "Em produção", color: "bg-purple-100 text-purple-700" },
  { value: "shipped", label: "Enviado", color: "bg-indigo-100 text-indigo-700" },
  { value: "delivered", label: "Entregue", color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "Cancelado", color: "bg-red-100 text-red-700" },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [whatsappUrls, setWhatsappUrls] = useState<Record<string, string>>({});

  const fetchOrders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, profiles!orders_user_id_fkey(full_name, email, phone)")
      .order("created_at", { ascending: false });
    setOrders((data as any[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const toggleExpand = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    setExpandedOrder(orderId);
    if (!orderItems[orderId]) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      setOrderItems((prev) => ({ ...prev, [orderId]: (data as any[]) ?? [] }));
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    toast.success("Status atualizado!");
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));

    // Trigger post-purchase automation
    if (["confirmed", "processing", "shipped", "delivered"].includes(status)) {
      try {
        const { data } = await supabase.functions.invoke("order-status-webhook", {
          body: { order_id: orderId, new_status: status },
        });
        if (data?.whatsapp_url) {
          setWhatsappUrls(prev => ({ ...prev, [orderId]: data.whatsapp_url }));
          toast.success("Mensagem de WhatsApp gerada! Clique no ícone para enviar.", { duration: 5000 });
        }
      } catch (err) {
        console.error("Automation error:", err);
      }
    }
  };
  const getStatusInfo = (status: string) => STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">Pedidos</h1>
        <p className="text-sm text-muted-foreground">{orders.length} pedido(s)</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum pedido ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = getStatusInfo(order.status);
            const profile = order.profiles;
            return (
              <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button onClick={() => toggleExpand(order.id)} className="w-full p-4 flex items-center gap-4 text-left">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-sm font-medium">{profile?.full_name || profile?.email || "Cliente"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")} — R$ {Number(order.total).toFixed(2)}</p>
                  </div>
                  {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {expandedOrder === order.id && (
                  <div className="border-t border-border p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cliente</p>
                        <p className="font-medium">{profile?.full_name || "—"}</p>
                        <p>{profile?.email || "—"}</p>
                        <p>{profile?.phone || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valores</p>
                        <p>Subtotal: R$ {Number(order.subtotal).toFixed(2)}</p>
                        {Number(order.discount) > 0 && <p className="text-green-600">Desconto: -R$ {Number(order.discount).toFixed(2)}</p>}
                        <p className="font-bold">Total: R$ {Number(order.total).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Status</p>
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                        >
                          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        {whatsappUrls[order.id] && (
                          <a
                            href={whatsappUrls[order.id]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mt-2"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Enviar WhatsApp
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Shipping address */}
                    {order.shipping_address && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Endereço de entrega</p>
                        <p>{order.shipping_address}, {order.shipping_number}{order.shipping_complement ? ` - ${order.shipping_complement}` : ""}</p>
                        <p>{order.shipping_neighborhood} — {order.shipping_city}/{order.shipping_state} — CEP: {order.shipping_cep}</p>
                        {order.shipping_service && <p className="text-xs text-muted-foreground mt-1">Frete: {order.shipping_carrier} {order.shipping_service} — R$ {Number(order.shipping_cost || 0).toFixed(2)}</p>}
                      </div>
                    )}

                    {/* Tracking code */}
                    <div className="text-sm">
                      <p className="text-muted-foreground mb-1">Código de Rastreio</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ex: BR123456789BR"
                          defaultValue={order.tracking_code || ""}
                          onBlur={async (e) => {
                            const code = e.target.value.trim();
                            const url = code ? `https://rastreamento.correios.com.br/app/index.php?objeto=${code}` : null;
                            await supabase.from("orders").update({ tracking_code: code || null, tracking_url: url }).eq("id", order.id);
                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, tracking_code: code || null, tracking_url: url } : o));
                            if (code) toast.success("Código de rastreio salvo!");
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring outline-none"
                        />
                      </div>
                    </div>

                    {order.notes && <div className="text-sm"><p className="text-muted-foreground">Observações:</p><p>{order.notes}</p></div>}

                    <div>
                      <p className="text-sm font-medium mb-2">Itens do pedido:</p>
                      {orderItems[order.id]?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm py-1 border-b border-border last:border-0">
                          <span>{item.quantity}x {item.product_name}</span>
                          <span>R$ {(Number(item.unit_price) * item.quantity).toFixed(2)}</span>
                        </div>
                      )) ?? <p className="text-xs text-muted-foreground">Carregando itens...</p>}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={async () => {
                          try {
                            const items = orderItems[order.id];
                            if (!items) return;
                            await generateQuotePdf(
                              items.map((i) => ({ name: i.product_name, quantity: i.quantity, price: Number(i.unit_price) })),
                              { name: order.customer_name || profile?.full_name || undefined, email: order.customer_email || profile?.email || undefined }
                            );
                          } catch { toast.error("Erro ao gerar orçamento"); }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" /> Orçamento
                      </button>
                      <button
                        onClick={async () => {
                          try { await generateReceiptPdf(order.id); } catch { toast.error("Erro ao gerar recibo"); }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" /> Recibo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
