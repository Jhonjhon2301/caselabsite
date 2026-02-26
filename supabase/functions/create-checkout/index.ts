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

    // Try to get authenticated user (optional - guest checkout allowed)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const { items, customer, shipping } = await req.json();

    if (!items?.length || !customer?.email || !customer?.name || !shipping?.cep) {
      throw new Error("Dados incompletos");
    }

    // Create order in DB
    const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        subtotal,
        total: subtotal,
        discount: 0,
        status: "pending",
        payment_status: "pending",
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || null,
        customer_cpf: customer.cpf || null,
        shipping_cep: shipping.cep,
        shipping_address: shipping.address,
        shipping_number: shipping.number,
        shipping_complement: shipping.complement || null,
        shipping_neighborhood: shipping.neighborhood,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
      })
      .select("id")
      .single();

    if (orderError) throw new Error(`Erro ao criar pedido: ${orderError.message}`);

    // Create order items
    const orderItems = items.map((i: any) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.name,
      unit_price: i.price,
      quantity: i.quantity,
    }));

    await supabaseAdmin.from("order_items").insert(orderItems);

    // Create Stripe Checkout session
    const lineItems = items.map((i: any) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: i.name,
          images: i.image ? [i.image] : [],
        },
        unit_amount: Math.round(i.price * 100),
      },
      quantity: i.quantity,
    }));

    const checkoutBase = {
      line_items: lineItems,
      mode: "payment" as const,
      success_url: `${req.headers.get("origin")}/payment-success?order_id=${order.id}`,
      cancel_url: `${req.headers.get("origin")}/payment-canceled`,
      customer_email: customer.email,
      metadata: {
        order_id: order.id,
      },
    };

    let session;

    try {
      session = await stripe.checkout.sessions.create({
        ...checkoutBase,
        payment_method_types: ["card", "pix"],
        payment_method_options: {
          pix: {
            expires_after_seconds: 1800,
          },
        },
      });
    } catch (stripeError: any) {
      const pixInvalid =
        stripeError?.message?.includes("payment method type provided: pix is invalid") ||
        stripeError?.code === "parameter_invalid_enum";

      if (!pixInvalid) throw stripeError;

      console.warn("Pix not enabled on Stripe account. Falling back to card-only checkout.");
      session = await stripe.checkout.sessions.create({
        ...checkoutBase,
        payment_method_types: ["card"],
      });
    }

    // Save stripe session id to order
    await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
