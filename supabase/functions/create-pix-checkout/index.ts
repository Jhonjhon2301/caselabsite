import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INFINITEPAY_HANDLE = "case-lab";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Optional auth
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
    const shippingCost = shipping.cost || 0;
    const total = subtotal + shippingCost;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId || "00000000-0000-0000-0000-000000000000",
        subtotal,
        total,
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
        shipping_carrier: shipping.carrier || null,
        shipping_service: shipping.service || null,
        shipping_estimated_days: shipping.estimated_days || null,
        shipping_original_cost: shipping.original_cost || 0,
        shipping_cost: shippingCost,
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

    // Build InfinitePay payload
    const origin = req.headers.get("origin") || "";
    const infinitePayItems = items.map((i: any) => ({
      description: i.name,
      quantity: i.quantity,
      price: Math.round(i.price * 100), // centavos
    }));

    const payload: any = {
      handle: INFINITEPAY_HANDLE,
      items: infinitePayItems,
      order_nsu: order.id,
      redirect_url: `${origin}/payment-success?order_id=${order.id}`,
      customer: {
        name: customer.name,
        email: customer.email,
        phone_number: customer.phone ? customer.phone.replace(/\D/g, "") : undefined,
      },
    };

    // Add address if available
    if (shipping.cep) {
      payload.address = {
        cep: shipping.cep.replace(/\D/g, ""),
        street: shipping.address,
        neighborhood: shipping.neighborhood,
        number: shipping.number,
        complement: shipping.complement || undefined,
      };
    }

    console.log("InfinitePay payload:", JSON.stringify(payload));

    const response = await fetch("https://api.infinitepay.io/invoices/public/checkout/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("InfinitePay response status:", response.status);
    console.log("InfinitePay response:", responseText);

    if (!response.ok) {
      throw new Error(`InfinitePay error (${response.status}): ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Some APIs return the URL directly as text
      data = { url: responseText.trim().replace(/"/g, "") };
    }

    const checkoutUrl = data.url || data.checkout_url || data.link;
    if (!checkoutUrl) {
      throw new Error("URL de pagamento Pix não retornada");
    }

    return new Response(JSON.stringify({ url: checkoutUrl, order_id: order.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Pix checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
