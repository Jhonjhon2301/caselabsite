import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find orders delivered 20+ days ago that haven't had a repurchase automation
    const twentyDaysAgo = new Date();
    twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

    const { data: deliveredOrders, error: ordersError } = await supabase
      .from("orders")
      .select("id, user_id, customer_name, customer_phone, customer_email, total, status, updated_at")
      .eq("status", "delivered")
      .eq("payment_status", "paid")
      .lte("updated_at", twentyDaysAgo.toISOString());

    if (ordersError) throw ordersError;
    if (!deliveredOrders || deliveredOrders.length === 0) {
      return new Response(JSON.stringify({ message: "No orders eligible for repurchase" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which ones already have a repurchase automation
    const orderIds = deliveredOrders.map((o) => o.id);
    const { data: existingAutomations } = await supabase
      .from("order_automations")
      .select("order_id")
      .in("order_id", orderIds)
      .eq("automation_type", "repurchase_offer");

    const existingSet = new Set((existingAutomations || []).map((a) => a.order_id));
    const eligibleOrders = deliveredOrders.filter((o) => !existingSet.has(o.id));

    if (eligibleOrders.length === 0) {
      return new Response(JSON.stringify({ message: "All eligible orders already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create automation records + generate WhatsApp messages
    const automations = eligibleOrders.map((order) => ({
      order_id: order.id,
      automation_type: "repurchase_offer",
      status: "sent",
      sent_at: new Date().toISOString(),
      metadata: {
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_email: order.customer_email,
        message: `Olá ${order.customer_name || ""}! 🎉 Já faz um tempo desde sua última compra na Case Lab. Que tal reabastecer? Use o cupom VOLTA10 para 10% de desconto! 🛒`,
      },
    }));

    const { error: insertError } = await supabase.from("order_automations").insert(automations);
    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        message: `${automations.length} repurchase offers created`,
        count: automations.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
