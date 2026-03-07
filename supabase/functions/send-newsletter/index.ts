import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY não configurado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { subject, content, preview_email } = await req.json();
    if (!subject || !content) throw new Error("subject e content são obrigatórios");

    // If preview_email is set, send only to that email
    let recipients: string[] = [];

    if (preview_email) {
      recipients = [preview_email];
    } else {
      // Fetch all lead emails
      const { data: leads, error } = await supabase
        .from("lead_captures")
        .select("email")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Deduplicate emails
      const emailSet = new Set<string>();
      for (const lead of leads ?? []) {
        if (lead.email) emailSet.add(lead.email.toLowerCase().trim());
      }
      recipients = Array.from(emailSet);
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum destinatário encontrado" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildNewsletterHtml(subject, content);

    // Send in batches of 50
    const batchSize = 50;
    let sent = 0;
    let errors = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const resendRes = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          batch.map((email) => ({
            from: "Case Lab <onboarding@resend.dev>",
            to: [email],
            subject,
            html,
          }))
        ),
      });

      if (resendRes.ok) {
        sent += batch.length;
      } else {
        const errBody = await resendRes.text();
        console.error("Resend batch error:", errBody);
        errors += batch.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        errors,
        total: recipients.length,
        is_preview: !!preview_email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Newsletter error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function buildNewsletterHtml(subject: string, content: string) {
  // Convert line breaks to HTML
  const contentHtml = content
    .split("\n")
    .map((line: string) => (line.trim() ? `<p style="margin:0 0 12px;color:#3f3f46;font-size:15px;line-height:1.6">${line}</p>` : ""))
    .join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#18181b;padding:20px;text-align:center;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Case Lab</h1>
    <p style="color:#a1a1aa;margin:4px 0 0;font-size:13px">Garrafas Personalizadas</p>
  </div>
  <div style="background:#fff;padding:28px 24px;border-radius:0 0 12px 12px">
    <h2 style="margin:0 0 16px;color:#18181b;font-size:20px">${subject}</h2>
    ${contentHtml}
    <div style="text-align:center;margin:24px 0">
      <a href="https://caselabsite.lovable.app" style="background:#18181b;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">Visitar a Loja →</a>
    </div>
    <hr style="border:none;border-top:1px solid #e4e4e7;margin:20px 0">
    <p style="font-size:11px;color:#a1a1aa;text-align:center">
      Você recebeu este e-mail por estar cadastrado na Case Lab.<br>
      Case Lab — Garrafas Personalizadas
    </p>
  </div>
</div>
</body></html>`;
}
