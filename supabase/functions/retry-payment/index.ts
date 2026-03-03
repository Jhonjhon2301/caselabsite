import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) throw new Error("Não autenticado");

    const { order_id } = await req.json();
    if (!order_id) throw new Error("order_id é obrigatório");

    // Fetch order (must belong to user and be pending payment)
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) throw new Error("Pedido não encontrado");
    if (order.payment_status === "paid") throw new Error("Pedido já foi pago");

    // Fetch order items
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", order_id);

    if (!items?.length) throw new Error("Itens do pedido não encontrados");

    // Create new Stripe Checkout session
    const lineItems = items.map((i: any) => ({
      price_data: {
        currency: "brl",
        product_data: { name: i.product_name },
        unit_amount: Math.round(i.unit_price * 100),
      },
      quantity: i.quantity,
    }));

    // Add shipping as line item if applicable
    if (Number(order.shipping_cost) > 0) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: `Frete ${order.shipping_carrier || ""} ${order.shipping_service || ""}`.trim() },
          unit_amount: Math.round(Number(order.shipping_cost) * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?order_id=${order.id}`,
      cancel_url: `${req.headers.get("origin")}/meus-pedidos`,
      customer_email: order.customer_email,
      metadata: { order_id: order.id },
      payment_method_types: ["card"],
    });

    // Update stripe session id
    await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Retry payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
