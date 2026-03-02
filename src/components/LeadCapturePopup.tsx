import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Gift } from "lucide-react";

interface PopupConfig {
  enabled: boolean;
  delay_seconds: number;
  title: string;
  subtitle: string;
  coupon_code: string;
  discount_label: string;
  button_text: string;
}

const defaults: PopupConfig = {
  enabled: true,
  delay_seconds: 15,
  title: "Ganhe 10% OFF",
  subtitle: "na sua primeira compra!",
  coupon_code: "BEMVINDO10",
  discount_label: "10%",
  button_text: "Quero meu cupom de 10%",
};

export default function LeadCapturePopup() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState<PopupConfig>(defaults);

  useEffect(() => {
    const dismissed = localStorage.getItem("lead_popup_dismissed");
    if (dismissed) return;

    // Load config from site_settings
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "lead_popup")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as unknown as Partial<PopupConfig>;
          setCfg((prev) => ({ ...prev, ...v }));
          if (v.enabled === false) return;
        }
        const delay = (data?.value as any)?.delay_seconds ?? defaults.delay_seconds;
        const timer = setTimeout(() => setShow(true), delay * 1000);
        return () => clearTimeout(timer);
      });
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("lead_popup_dismissed", Date.now().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    await supabase.from("lead_captures" as any).insert({
      email: email.trim(),
      name: name.trim() || null,
      source: "popup",
      page_url: window.location.pathname,
      coupon_code: cfg.coupon_code,
    });

    setSubmitted(true);
    setLoading(false);
    localStorage.setItem("lead_popup_dismissed", Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="gradient-brand p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-heading font-black text-white">{cfg.title}</h2>
          <p className="text-white/80 text-sm mt-1">{cfg.subtitle}</p>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-lg font-heading font-bold text-emerald-600 mb-2">🎉 Cupom enviado!</p>
              <p className="text-sm text-muted-foreground">
                Use o cupom <span className="font-bold text-foreground">{cfg.coupon_code}</span> na sua compra.
              </p>
              <button onClick={dismiss} className="btn-primary mt-4 text-sm">Ir às compras</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-2">
                Cadastre-se e receba um cupom exclusivo de desconto
              </p>
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm"
                maxLength={100}
              />
              <input
                type="email"
                placeholder="Seu melhor e-mail *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm"
                required
                maxLength={200}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary text-sm disabled:opacity-50"
              >
                {loading ? "Enviando..." : cfg.button_text}
              </button>
              <button type="button" onClick={dismiss} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                Não, obrigado
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
