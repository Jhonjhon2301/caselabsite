import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPT = `Process this bottle image individually. Do NOT combine multiple bottles.

Remove the background completely with precise and clean cutout edges, preserving 100% of the original product details, texture, material finish, logo, shadows, and true color.

DO NOT change the color under any circumstances (especially beige tones — maintain the exact original shade). Do not modify saturation, hue, brightness, contrast, or color balance.

Enhance the image quality significantly while keeping it realistic:
- Increase resolution, sharpness, micro-details, and clarity.
- Reduce noise and compression artifacts.
- Improve definition and depth without altering the product's design or features.
- Do not retouch or redesign any physical details.

Maintain realistic proportions and true-to-life scale.

Recreate the image as a high-end professional studio product photograph with a pure white background (#FFFFFF).

Use realistic commercial studio lighting:
- Soft diffused key light, balanced fill light, natural depth, and a subtle realistic shadow directly beneath the bottle.
- Lighting must look natural and physically accurate.

Camera angle: straight front view, center aligned.

Do NOT: combine products, create a collage, change proportions, add reflections that do not exist, modify materials, alter logos or design elements, stylize or redesign the product.

Final result: ultra-realistic, high-resolution, studio-grade product photography, isolated on white background, one bottle per image, true-to-life appearance.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { imageUrl } = await req.json();
    if (!imageUrl) throw new Error("imageUrl is required");

    console.log("Processing image:", imageUrl);

    // Call AI to process the image
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: PROMPT },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted, please add funds" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const generatedImage =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generatedImage) {
      console.error("No image in AI response:", JSON.stringify(aiData).slice(0, 500));
      throw new Error("AI did not return a processed image");
    }

    // Upload the processed image to storage
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Decode base64
    const base64Data = generatedImage.replace(/^data:image\/\w+;base64,/, "");
    const binaryData = Uint8Array.from(atob(base64Data), (c) =>
      c.charCodeAt(0)
    );

    const fileName = `processed-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, binaryData, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload processed image: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    console.log("Processed image uploaded:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ processedUrl: urlData.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-product-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
