import { Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PromoConfig {
  promo_text: string;
  promo_link_text: string;
  promo_link_url: string;
  is_visible: boolean;
}

const defaults: PromoConfig = {
  promo_text: "🎟️ CUPONS DISPONÍVEIS 🎟️",
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
          setCfg({
            promo_text: v.promo_text || defaults.promo_text,
            promo_link_text: v.promo_link_text || defaults.promo_link_text,
            promo_link_url: v.promo_link_url || defaults.promo_link_url,
            is_visible: v.is_visible ?? true,
          });
        }
      });
  }, []);

  if (!cfg.is_visible) return null;

  return (
    <div className="bg-primary text-primary-foreground py-2.5 text-center">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-3 text-sm font-bold">
        <span className="flex items-center gap-1.5">
          <Ticket className="w-4 h-4" />
          {cfg.promo_text}
        </span>
        <span className="hidden sm:inline text-primary-foreground/50">|</span>
        <a
          href={cfg.promo_link_url}
          className="underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          {cfg.promo_link_text}
        </a>
      </div>
    </div>
  );
}
