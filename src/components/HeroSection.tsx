import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import garrafa6 from "@/assets/products/garrafa-6.png";
import garrafa1 from "@/assets/products/garrafa-1.png";

interface BannerConfig {
  badge_text: string;
  title_line1: string;
  title_line2: string;
  description: string;
  cta_text: string;
  cta2_text: string;
  marquee_text: string;
  image1_url: string;
  image2_url: string;
}

const defaults: BannerConfig = {
  badge_text: "GARRAFAS TÉRMICAS",
  title_line1: "PERSONALIZE",
  title_line2: "SUA GARRAFA",
  description: "A cara da sua empresa, profissão ou estilo pessoal em uma garrafa térmica exclusiva.",
  cta_text: "VER MODELOS",
  cta2_text: "ORÇAMENTO",
  marquee_text: "GARRAFAS PERSONALIZADAS • QUALIDADE PREMIUM • ENTREGA PARA TODO BRASIL • SUA MARCA, SUA GARRAFA •",
  image1_url: "",
  image2_url: "",
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
        if (data?.value) setCfg({ ...defaults, ...(data.value as unknown as BannerConfig) });
      });
  }, []);

  const img1 = cfg.image1_url || garrafa1;
  const img2 = cfg.image2_url || garrafa6;

  return (
    <section className="relative overflow-hidden gradient-brand">
      <div className="container mx-auto py-10 md:py-16 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 text-center md:text-left z-10">
          <span className="inline-block bg-brand-dark text-primary-foreground text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-wider">
            {cfg.badge_text}
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-black text-primary-foreground leading-[0.95] mb-4">
            {cfg.title_line1}<br />
            <span className="text-brand-dark">{cfg.title_line2}</span>
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/80 max-w-md mb-6 font-light">
            {cfg.description}
          </p>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start">
            <a href="#produtos" className="btn-dark">
              {cfg.cta_text}
            </a>
            <a href="https://wa.me/5561992629861" target="_blank" rel="noopener noreferrer" className="btn-outline border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-foreground">
              {cfg.cta2_text}
            </a>
          </div>
        </div>
        <div className="flex-1 flex items-end justify-center gap-4 relative">
          <img
            src={img1}
            alt="Garrafa personalizada"
            className="w-36 md:w-48 drop-shadow-2xl -rotate-6 translate-y-4 hover:scale-105 transition-transform duration-500"
          />
          <img
            src={img2}
            alt="Garrafa personalizada"
            className="w-44 md:w-56 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>

      <div className="bg-brand-dark py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="text-xs font-bold text-primary-foreground/80 tracking-[0.2em] mx-8">
              {cfg.marquee_text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
