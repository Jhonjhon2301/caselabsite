import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find abandoned carts older than 1 hour that haven't been recovered
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const maxAttempts = 3;

    const { data: carts, error } = await supabaseAdmin
      .from("abandoned_carts")
      .select("*")
      .eq("recovery_status", "pending")
      .lt("recovery_attempts", maxAttempts)
      .lt("updated_at", oneHourAgo)
      .is("recovered_at", null)
      .not("customer_phone", "is", null)
      .limit(50);

    if (error) throw error;

    const results: any[] = [];

    for (const cart of carts || []) {
      try {
        // Generate a recovery coupon if first attempt
        let couponCode = cart.coupon_code;
        if (!couponCode && cart.recovery_attempts === 0) {
          couponCode = `VOLTA${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          
          // Create coupon in DB (10% discount, single use, expires in 48h)
          await supabaseAdmin.from("coupons").insert({
            code: couponCode,
            discount_type: "percentage",
            discount_value: 10,
            is_active: true,
            max_uses: 1,
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          });
        }

        // Build WhatsApp message
        const items = cart.items as any[];
        const itemNames = items.map((i: any) => i.name).join(", ");
        const total = `R$ ${Number(cart.total).toFixed(2).replace(".", ",")}`;
        
        const message = encodeURIComponent(
          `Olá ${cart.customer_name || ""}! 😊\n\n` +
          `Notamos que você deixou alguns itens no carrinho da Case Lab:\n` +
          `📦 ${itemNames}\n` +
          `💰 Total: ${total}\n\n` +
          (couponCode
            ? `🎟️ Use o cupom *${couponCode}* e ganhe 10% de desconto! Válido por 48h.\n\n`
            : "") +
          `Finalize sua compra aqui: ${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "https://caselab.com.br"}\n\n` +
          `Qualquer dúvida, estamos aqui! 💙`
        );

        const phone = cart.customer_phone?.replace(/\D/g, "");
        const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

        // Update cart with recovery attempt
        await supabaseAdmin
          .from("abandoned_carts")
          .update({
            recovery_attempts: (cart.recovery_attempts || 0) + 1,
            last_recovery_at: new Date().toISOString(),
            coupon_code: couponCode,
            recovery_status: cart.recovery_attempts >= maxAttempts - 1 ? "max_attempts" : "pending",
          })
          .eq("id", cart.id);

        results.push({
          cart_id: cart.id,
          phone,
          whatsapp_url: whatsappUrl,
          coupon: couponCode,
          attempt: (cart.recovery_attempts || 0) + 1,
        });
      } catch (cartError: any) {
        console.error(`Error processing cart ${cart.id}:`, cartError);
        results.push({ cart_id: cart.id, error: cartError.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Recovery error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
