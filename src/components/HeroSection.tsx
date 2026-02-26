import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import garrafa6 from "@/assets/products/garrafa-6.png";
import garrafa1 from "@/assets/products/garrafa-1.png";
import garrafa3 from "@/assets/products/garrafa-3.png";

interface BannerConfig {
  banner_image_url: string;
  marquee_text: string;
}

const defaults: BannerConfig = {
  banner_image_url: "",
  marquee_text: "MELHORES OFERTAS DO ANO • GARRAFAS PERSONALIZADAS • QUALIDADE PREMIUM • ENTREGA PARA TODO BRASIL •",
};

export default function HeroSection() {
  const [cfg, setCfg] = useState<BannerConfig>(defaults);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero_banner")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as unknown as BannerConfig;
          setCfg({
            banner_image_url: v.banner_image_url || "",
            marquee_text: v.marquee_text || defaults.marquee_text,
          });
        }
      });
  }, []);

  return (
    <section className="relative overflow-hidden">
      {cfg.banner_image_url ? (
        <div className="w-full">
          <img src={cfg.banner_image_url} alt="Banner Case Lab" className="w-full h-auto object-cover" />
        </div>
      ) : (
        <div className="relative gradient-brand-vibrant overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-background rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-background rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          </div>

          <div className="container mx-auto px-4 py-10 md:py-16 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
              {/* Text content */}
              <div className="flex-1 text-center md:text-left">
                <span className="inline-block bg-background/15 backdrop-blur-sm text-primary-foreground text-[10px] font-bold tracking-[0.3em] uppercase px-4 py-1.5 rounded-full mb-4">
                  ✨ Garrafas Térmicas Premium
                </span>

                <h1 className="font-heading font-black text-primary-foreground leading-[0.95] mb-4">
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">PERSONALIZE</span>
                  <span className="block text-2xl sm:text-3xl md:text-4xl font-bold opacity-90 mt-1">SUA GARRAFA</span>
                </h1>

                <p className="text-primary-foreground/80 text-sm md:text-base max-w-md leading-relaxed mb-6 mx-auto md:mx-0">
                  A cara da sua empresa, profissão ou estilo pessoal em uma garrafa térmica exclusiva.
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <a
                    href="#produtos"
                    className="bg-foreground text-background px-8 py-3 rounded-full font-bold text-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-2"
                  >
                    CONFERIR →
                  </a>
                </div>
              </div>

              {/* Product showcase */}
              <div className="flex-1 flex justify-center items-end relative">
                <div className="flex items-end gap-0 mt-4 md:mt-0">
                  <img
                    src={garrafa3}
                    alt="Garrafa personalizada"
                    className="w-24 md:w-32 lg:w-36 drop-shadow-2xl -rotate-12 hover:rotate-0 transition-transform duration-500"
                  />
                  <img
                    src={garrafa6}
                    alt="Garrafa personalizada"
                    className="w-32 md:w-44 lg:w-52 drop-shadow-2xl relative z-10 hover:scale-105 transition-transform duration-500"
                  />
                  <img
                    src={garrafa1}
                    alt="Garrafa personalizada"
                    className="w-24 md:w-32 lg:w-36 drop-shadow-2xl rotate-12 hover:rotate-0 transition-transform duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marquee — GoCase style */}
      <div className="bg-foreground py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="text-[11px] font-bold text-primary tracking-[0.25em] mx-8 uppercase">
              {cfg.marquee_text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
