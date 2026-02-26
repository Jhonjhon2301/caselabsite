import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import garrafa1 from "@/assets/products/garrafa-1.png";
import garrafa2 from "@/assets/products/garrafa-2.png";
import garrafa3 from "@/assets/products/garrafa-3.png";
import garrafa4 from "@/assets/products/garrafa-4.png";
import garrafa5 from "@/assets/products/garrafa-5.png";
import garrafa6 from "@/assets/products/garrafa-6.png";
import garrafa7 from "@/assets/products/garrafa-7.png";
import garrafa8 from "@/assets/products/garrafa-8.png";
import garrafa9 from "@/assets/products/garrafa-9.png";

const bottleImages = [garrafa1, garrafa2, garrafa3, garrafa4, garrafa5, garrafa6, garrafa7, garrafa8, garrafa9];

interface BannerConfig {
  banner_image_url: string;
  marquee_text: string;
  countdown_end: string;
  promo_title: string;
  promo_subtitle: string;
  cta_text: string;
  cta_link: string;
}

const defaults: BannerConfig = {
  banner_image_url: "",
  marquee_text: "MELHORES OFERTAS DO ANO • GARRAFAS PERSONALIZADAS • FRETE GRÁTIS ACIMA DE R$299",
  countdown_end: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  promo_title: "PISCOU, PERDEU",
  promo_subtitle: "Garrafas a partir de R$79,90 + MIMO!",
  cta_text: "COMPRAR AGORA",
  cta_link: "#produtos",
};

function useCountdown(target: string) {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, new Date(target).getTime() - Date.now());
      setTime({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return time;
}

export default function HeroSection() {
  const [cfg, setCfg] = useState<BannerConfig>(defaults);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero_banner")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as unknown as Partial<BannerConfig>;
          setCfg((prev) => ({ ...prev, ...v }));
        }
      });
  }, []);

  // Auto-rotate featured bottles
  useEffect(() => {
    const id = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const countdown = useCountdown(cfg.countdown_end);
  const pad = (n: number) => String(n).padStart(2, "0");

  // 3 featured bottle groups
  const bottleGroups = [
    [bottleImages[0], bottleImages[1], bottleImages[2]],
    [bottleImages[3], bottleImages[4], bottleImages[5]],
    [bottleImages[6], bottleImages[7], bottleImages[8]],
  ];

  return (
    <section className="relative overflow-hidden">
      {cfg.banner_image_url ? (
        /* Custom banner uploaded via admin */
        <a href={cfg.cta_link} className="block relative">
          <img src={cfg.banner_image_url} alt="Banner" className="w-full h-auto object-cover" />
          <div className="absolute bottom-6 left-6 md:left-12 flex flex-col items-start gap-3">
            <div className="flex items-center gap-2">
              {[
                { val: pad(countdown.h), label: "H" },
                { val: pad(countdown.m), label: "M" },
                { val: pad(countdown.s), label: "S" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-xl font-black text-white">:</span>}
                  <div className="bg-background/95 backdrop-blur-sm rounded-lg px-3 py-1.5 text-center min-w-[52px] shadow-lg">
                    <span className="block text-xl font-black text-primary leading-none">{item.val}</span>
                    <span className="block text-[8px] font-bold text-muted-foreground uppercase">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </a>
      ) : (
        /* Default interactive hero with bottle showcase */
        <div className="relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(24,100%,52%)] via-[hsl(20,95%,45%)] to-[hsl(16,90%,35%)]" />
          
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full" />

          <div className="container mx-auto px-4 py-8 md:py-14 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
              
              {/* Left: Text + Countdown */}
              <div className="flex-1 text-center lg:text-left">
                {/* Promo badge */}
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider">Oferta por tempo limitado</span>
                </div>

                <h1 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] tracking-tight mb-3">
                  {cfg.promo_title}
                </h1>
                <p className="text-white/85 font-semibold text-base md:text-lg mb-6 max-w-md mx-auto lg:mx-0">
                  {cfg.promo_subtitle}
                </p>

                {/* Countdown */}
                <div className="flex items-center gap-2 justify-center lg:justify-start mb-6">
                  {[
                    { val: pad(countdown.h), label: "Horas" },
                    { val: pad(countdown.m), label: "Min" },
                    { val: pad(countdown.s), label: "Seg" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-2xl font-black text-white/60">:</span>}
                      <div className="bg-white rounded-xl px-4 py-2 text-center min-w-[68px] shadow-xl">
                        <span className="block text-2xl md:text-3xl font-black text-primary leading-none">{item.val}</span>
                        <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href={cfg.cta_link}
                  className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-2xl"
                >
                  {cfg.cta_text} →
                </a>
              </div>

              {/* Right: Interactive bottle showcase */}
              <div className="flex-1 relative flex items-center justify-center min-h-[280px] md:min-h-[360px]">
                {/* Glow behind bottles */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full blur-3xl" />
                </div>

                {/* Bottle display */}
                <div className="relative flex items-end justify-center gap-3 md:gap-5">
                  {bottleGroups[activeSlide].map((bottle, i) => {
                    const isCenter = i === 1;
                    return (
                      <div
                        key={`${activeSlide}-${i}`}
                        className="transition-all duration-700 ease-out"
                        style={{
                          transform: isCenter ? "scale(1.15) translateY(-10px)" : "scale(0.9)",
                          opacity: isCenter ? 1 : 0.75,
                          zIndex: isCenter ? 10 : 1,
                        }}
                      >
                        <img
                          src={bottle}
                          alt="Garrafa"
                          className="h-48 md:h-72 lg:h-80 object-contain drop-shadow-2xl"
                          draggable={false}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Slide indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                  {bottleGroups.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeSlide === i ? "w-6 bg-white" : "w-1.5 bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Marquee */}
      <div className="bg-foreground py-2.5 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-[11px] font-bold text-primary tracking-[0.2em] mx-8 uppercase">
              {cfg.marquee_text} •
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
