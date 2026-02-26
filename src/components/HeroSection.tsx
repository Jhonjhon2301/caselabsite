import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BannerConfig {
  banner_image_url: string;
  marquee_text: string;
  countdown_end: string; // ISO date string
  promo_title: string;
  promo_subtitle: string;
  cta_text: string;
  cta_link: string;
}

const defaults: BannerConfig = {
  banner_image_url: "",
  marquee_text: "MELHORES OFERTAS DO ANO",
  countdown_end: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  promo_title: "PISCOU PERDEU",
  promo_subtitle: "SALE MODO GO",
  cta_text: "CONFERIR",
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

  const countdown = useCountdown(cfg.countdown_end);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="relative overflow-hidden">
      {/* Hero Banner */}
      {cfg.banner_image_url ? (
        <a href={cfg.cta_link} className="block relative">
          <img src={cfg.banner_image_url} alt="Banner" className="w-full h-auto object-cover" />
          {/* Countdown overlay */}
          <div className="absolute bottom-8 left-8 md:left-16 flex flex-col items-start gap-3">
            <div className="flex items-center gap-2">
              {[
                { val: pad(countdown.h), label: "Horas" },
                { val: pad(countdown.m), label: "Minutos" },
                { val: pad(countdown.s), label: "Segundos" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="text-2xl font-black text-foreground">:</span>}
                  <div className="bg-background rounded-lg px-4 py-2 text-center min-w-[70px] shadow-lg">
                    <span className="block text-2xl md:text-3xl font-black text-primary leading-none">{item.val}</span>
                    <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <a
              href={cfg.cta_link}
              className="bg-foreground text-background px-8 py-3 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              {cfg.cta_text} →
            </a>
          </div>
        </a>
      ) : (
        /* Default orange gradient hero */
        <div className="relative bg-gradient-to-br from-[hsl(30,100%,55%)] via-[hsl(24,95%,50%)] to-[hsl(20,90%,42%)] overflow-hidden">
          <div className="container mx-auto px-4 py-10 md:py-16 relative z-10">
            <div className="flex flex-col items-center text-center gap-6">
              <h2 className="font-heading font-black text-4xl md:text-6xl text-white uppercase tracking-tight">
                {cfg.promo_title}
              </h2>
              <p className="text-white/90 font-bold text-lg uppercase tracking-widest border-t-2 border-b-2 border-white/40 py-2 px-6">
                {cfg.promo_subtitle}
              </p>

              {/* Countdown */}
              <div className="flex items-center gap-2">
                {[
                  { val: pad(countdown.h), label: "Horas" },
                  { val: pad(countdown.m), label: "Minutos" },
                  { val: pad(countdown.s), label: "Segundos" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-2xl font-black text-white">:</span>}
                    <div className="bg-background rounded-xl px-5 py-3 text-center min-w-[80px] shadow-lg">
                      <span className="block text-3xl md:text-4xl font-black text-primary leading-none">{item.val}</span>
                      <span className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-1">{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href={cfg.cta_link}
                className="bg-foreground text-background px-10 py-3.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 shadow-xl"
              >
                {cfg.cta_text} →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Marquee — GoCase style: black bar with scrolling text */}
      <div className="bg-foreground py-2.5 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="text-[11px] font-bold text-primary tracking-[0.3em] mx-8 uppercase">
              {cfg.marquee_text} •
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
