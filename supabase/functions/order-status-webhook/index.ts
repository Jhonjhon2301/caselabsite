import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_MESSAGES: Record<string, { label: string; emoji: string; message: string }> = {
  confirmed: {
    label: "Confirmado",
    emoji: "✅",
    message: "Seu pedido foi confirmado e está sendo preparado! Em breve iniciaremos a produção.",
  },
  processing: {
    label: "Em Produção",
    emoji: "🎨",
    message: "Seu pedido está sendo produzido com todo cuidado e carinho! Logo ficará pronto.",
  },
  shipped: {
    label: "Enviado",
    emoji: "📦",
    message: "Seu pedido foi enviado! Ele está a caminho do seu endereço. Fique de olho na entrega!",
  },
  delivered: {
    label: "Entregue",
    emoji: "🎉",
    message: "Seu pedido foi entregue! Esperamos que você ame sua garrafa personalizada. Nos conte o que achou!",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { order_id, new_status } = await req.json();

    if (!order_id || !new_status) {
      return new Response(JSON.stringify({ error: "order_id and new_status required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusInfo = STATUS_MESSAGES[new_status];
    if (!statusInfo) {
      return new Response(JSON.stringify({ message: "No automation for this status" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerName = order.customer_name || "Cliente";
    const customerPhone = order.customer_phone?.replace(/\D/g, "") || "";
    const items = (order.order_items as any[]) || [];
    const itemsList = items.map((i: any) => `${i.quantity}x ${i.product_name}`).join(", ");

    // Build WhatsApp message
    const whatsappMessage = `${statusInfo.emoji} *Case Lab — Atualização do Pedido*

Olá, ${customerName}! 👋

*Status:* ${statusInfo.label}
*Pedido:* #${order_id.slice(0, 8)}
*Itens:* ${itemsList}
*Total:* R$ ${Number(order.total).toFixed(2)}

${statusInfo.message}

${new_status === "delivered" ? "⭐ Gostou? Nos avalie! Sua opinião é muito importante para nós.\n" : ""}Dúvidas? Responda esta mensagem! 💬

_Case Lab — Garrafas Personalizadas_`;

    const whatsappUrl = customerPhone
      ? `https://wa.me/55${customerPhone}?text=${encodeURIComponent(whatsappMessage)}`
      : null;

    // Log automation
    await supabase.from("order_automations").insert({
      order_id,
      automation_type: `status_${new_status}`,
      status: "sent",
      sent_at: new Date().toISOString(),
      metadata: {
        whatsapp_url: whatsappUrl,
        message: whatsappMessage,
        customer_phone: customerPhone,
        customer_name: customerName,
      },
    });

    // If delivered, schedule review request (20 days later)
    if (new_status === "delivered") {
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + 20);

      await supabase.from("order_automations").insert({
        order_id,
        automation_type: "recompra_offer",
        status: "pending",
        scheduled_at: reviewDate.toISOString(),
        metadata: {
          customer_phone: customerPhone,
          customer_name: customerName,
          items: itemsList,
          total: order.total,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        whatsapp_url: whatsappUrl,
        message: `Automação "${statusInfo.label}" registrada`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Order status webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
