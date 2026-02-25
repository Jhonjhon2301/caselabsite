import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import garrafa6 from "@/assets/products/garrafa-6.png";
import garrafa1 from "@/assets/products/garrafa-1.png";
import { ChevronRight } from "lucide-react";

interface BannerConfig {
  banner_image_url: string;
  marquee_text: string;
}

const defaults: BannerConfig = {
  banner_image_url: "",
  marquee_text: "GARRAFAS PERSONALIZADAS • QUALIDADE PREMIUM • ENTREGA PARA TODO BRASIL • SUA MARCA, SUA GARRAFA •",
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
          <img
            src={cfg.banner_image_url}
            alt="Banner Case Lab"
            className="w-full h-auto object-cover"
          />
        </div>
      ) : (
        <div className="relative overflow-hidden bg-primary">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

          <div className="container mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-center min-h-[400px] md:min-h-[480px]">
              {/* Left — Text */}
              <div className="py-10 md:py-16 px-2">
                <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
                  <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                  <span className="text-primary-foreground text-[11px] font-bold tracking-[0.2em] uppercase">Garrafas Térmicas</span>
                </div>

                <h1 className="font-heading font-black text-primary-foreground leading-[0.9]">
                  <span className="block text-5xl md:text-6xl lg:text-7xl">PERSONA</span>
                  <span className="block text-5xl md:text-6xl lg:text-7xl">LIZE</span>
                  <span className="block text-2xl md:text-3xl lg:text-4xl font-bold mt-2 opacity-80">SUA GARRAFA</span>
                </h1>

                <p className="text-primary-foreground/70 text-sm md:text-base max-w-sm leading-relaxed mt-5 mb-8">
                  A cara da sua empresa, profissão ou estilo pessoal em uma garrafa térmica exclusiva e de alta qualidade.
                </p>

                <div className="flex flex-wrap gap-3">
                  <a href="#produtos" className="bg-foreground text-background px-7 py-3.5 rounded-full font-bold text-sm hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-2">
                    CONFERIR <ChevronRight className="w-4 h-4" />
                  </a>
                  <a href="https://wa.me/5561992629861" target="_blank" rel="noopener noreferrer" className="bg-primary-foreground/10 backdrop-blur-sm border-2 border-primary-foreground/30 text-primary-foreground px-7 py-3.5 rounded-full font-bold text-sm hover:bg-primary-foreground/20 active:scale-[0.98] transition-all duration-200">
                    ORÇAMENTO
                  </a>
                </div>
              </div>

              {/* Right — Product showcase */}
              <div className="relative flex items-end justify-center pb-0 md:pb-0">
                {/* Price badge */}
                <div className="absolute top-6 right-4 md:top-10 md:right-8 z-20 bg-background rounded-2xl p-4 shadow-lg text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">A partir de</p>
                  <p className="font-heading font-black text-3xl text-foreground leading-none mt-1">
                    R$<span className="text-primary">129</span><span className="text-base align-top">,90</span>
                  </p>
                </div>

                <div className="flex items-end gap-2 md:gap-4 mt-16 md:mt-0">
                  <img
                    src={garrafa1}
                    alt="Garrafa personalizada floral"
                    className="w-28 md:w-36 lg:w-44 drop-shadow-2xl -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 ease-out"
                  />
                  <img
                    src={garrafa6}
                    alt="Garrafa personalizada preta"
                    className="w-36 md:w-44 lg:w-52 drop-shadow-2xl hover:scale-105 transition-all duration-500 ease-out relative z-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marquee strip */}
      <div className="bg-foreground py-2.5 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="text-[11px] font-bold text-primary-foreground/60 tracking-[0.25em] mx-8 uppercase">
              {cfg.marquee_text}
            </span>
          ))}
        </div>
      </div>

      {/* Promo banner */}
      <div className="bg-primary py-3 text-center">
        <p className="text-primary-foreground text-sm font-bold">
          🎟️ CUPONS EXCLUSIVOS · <span className="underline">Frete Grátis a partir de R$299,90*</span>
        </p>
      </div>
    </section>
  );
}
