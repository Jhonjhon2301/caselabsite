import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import garrafa6 from "@/assets/products/garrafa-6.png";
import garrafa1 from "@/assets/products/garrafa-1.png";

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
        <div className="gradient-brand-vibrant relative overflow-hidden">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          
          <div className="container mx-auto py-14 md:py-20 lg:py-24 flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-block bg-background/10 backdrop-blur-sm text-primary-foreground text-[11px] font-bold px-4 py-1.5 rounded-full mb-5 tracking-[0.2em] border border-primary-foreground/10">
                ✦ GARRAFAS TÉRMICAS
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-8xl font-heading font-black text-primary-foreground leading-[0.9] mb-5 text-balance">
                PERSONALIZE<br />
                <span className="text-background/90">SUA GARRAFA</span>
              </h1>
              <p className="text-base md:text-lg text-primary-foreground/75 max-w-lg mb-8 leading-relaxed font-light">
                A cara da sua empresa, profissão ou estilo pessoal em uma garrafa térmica exclusiva e de alta qualidade.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <a href="#produtos" className="bg-background text-foreground px-7 py-3.5 rounded-lg font-bold text-sm hover:shadow-lg active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-2">
                  VER MODELOS
                </a>
                <a href="https://wa.me/5561992629861" target="_blank" rel="noopener noreferrer" className="border-2 border-primary-foreground/30 text-primary-foreground px-7 py-3.5 rounded-lg font-bold text-sm hover:bg-primary-foreground/10 active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-2 backdrop-blur-sm">
                  ORÇAMENTO
                </a>
              </div>
            </div>
            <div className="flex-1 flex items-end justify-center gap-5 relative">
              <div className="absolute -inset-10 bg-primary-foreground/5 rounded-full blur-3xl" />
              <img src={garrafa1} alt="Garrafa personalizada" className="w-36 md:w-48 drop-shadow-2xl -rotate-6 translate-y-4 hover:scale-105 hover:-rotate-3 transition-all duration-700 relative z-10" />
              <img src={garrafa6} alt="Garrafa personalizada" className="w-44 md:w-56 drop-shadow-2xl hover:scale-105 transition-all duration-700 relative z-10" />
            </div>
          </div>
        </div>
      )}

      {/* Marquee strip */}
      <div className="bg-brand-dark py-2.5 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="text-[11px] font-bold text-primary-foreground/60 tracking-[0.25em] mx-8 uppercase">
              {cfg.marquee_text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
