import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackPurchase } from "@/lib/tracking";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [nfeStatus, setNfeStatus] = useState<"idle" | "emitting" | "done" | "error">("idle");

  useEffect(() => {
    if (!orderId) return;

    // Track purchase event
    const trackOrder = async () => {
      const { data: order } = await supabase
        .from("orders")
        .select("total")
        .eq("id", orderId)
        .single();
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, product_name, unit_price, quantity")
        .eq("order_id", orderId);
      if (order && orderItems) {
        trackPurchase(
          orderId,
          Number(order.total),
          orderItems.map(i => ({ id: i.product_id || "", name: i.product_name, price: Number(i.unit_price), quantity: i.quantity }))
        );
      }
    };
    trackOrder();

    const emitNfe = async () => {
      setNfeStatus("emitting");
      try {
        const { data, error } = await supabase.functions.invoke("auto-emit-nfe", {
          body: { order_id: orderId },
        });
        if (error) throw error;
        setNfeStatus("done");
      } catch (err) {
        console.error("NF-e auto emit error:", err);
        setNfeStatus("error");
      }
    };

    emitNfe();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="font-heading text-3xl font-bold mb-2">Pagamento Confirmado!</h1>
        <p className="text-muted-foreground mb-4">
          Seu pedido foi recebido com sucesso.
        </p>

        {nfeStatus === "emitting" && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            Gerando nota fiscal...
          </div>
        )}
        {nfeStatus === "done" && (
          <p className="text-sm text-green-600 mb-6">
            ✅ Nota fiscal emitida! Você receberá por e-mail em instantes.
          </p>
        )}
        {nfeStatus === "error" && (
          <p className="text-sm text-muted-foreground mb-6">
            Sua nota fiscal será processada em breve.
          </p>
        )}

        <button onClick={() => navigate("/")} className="btn-primary">
          Voltar para a Loja
        </button>
      </div>
    </div>
  );
}
