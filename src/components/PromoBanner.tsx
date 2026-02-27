import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PromoConfig {
  promo_text: string;
  promo_link_text: string;
  promo_link_url: string;
  is_visible: boolean;
}

const defaults: PromoConfig = {
  promo_text: "🎟️ CUPONS EXTRA 🎟️",
  promo_link_text: "Frete Grátis a partir de R$299,90*",
  promo_link_url: "#produtos",
  is_visible: true,
};

export default function PromoBanner() {
  const [cfg, setCfg] = useState<PromoConfig>(defaults);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "promo_banner")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as unknown as PromoConfig;
          setCfg({ ...defaults, ...v });
        }
      });
  }, []);

  if (!cfg.is_visible) return null;

  return (
    <div className="bg-[hsl(220,60%,25%)] text-white py-2.5 sm:py-3 text-center">
      <div className="container mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-3">
        <span className="text-xs sm:text-sm font-bold">{cfg.promo_text}</span>
        <a
          href={cfg.promo_link_url}
          className="text-xs sm:text-sm font-bold underline underline-offset-2 hover:opacity-90 transition-opacity"
        >
          {cfg.promo_link_text}
        </a>
      </div>
    </div>
  );
}
