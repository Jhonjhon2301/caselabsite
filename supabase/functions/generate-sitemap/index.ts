import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get base URL from request or fallback
    const origin = req.headers.get("origin") || req.headers.get("referer")?.replace(/\/$/, "") || "https://caselab.com.br";
    const baseUrl = origin.replace(/\/$/, "");

    // Fetch active products
    const { data: products } = await supabase
      .from("products")
      .select("id, name, updated_at, images")
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    // Fetch categories
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, created_at");

    const now = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Product pages
    for (const p of products || []) {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : now;
      const slug = encodeURIComponent(p.id);
      xml += `
  <url>
    <loc>${baseUrl}/produto/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;
      
      // Add product images
      const images = p.images as string[] | null;
      if (images?.length) {
        for (const img of images.slice(0, 3)) {
          xml += `
    <image:image>
      <image:loc>${img}</image:loc>
      <image:title>${p.name.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</image:title>
    </image:image>`;
        }
      }
      xml += `
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" },
    });
  } catch (error) {
    console.error("Sitemap error:", error);
    return new Response("Error generating sitemap", { status: 500, headers: corsHeaders });
  }
});
