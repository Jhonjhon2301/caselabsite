import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Gift, Copy, Users, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

export default function Referral() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      // Check if user has a referral code
      const { data: existing } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });

      if (existing && existing.length > 0) {
        setReferralCode(existing[0].referral_code);
        setReferrals(existing);
      } else {
        // Generate unique code
        const code = `CASELAB${user.id.slice(0, 6).toUpperCase()}`;
        const { error } = await supabase.from("referrals").insert({
          referrer_user_id: user.id,
          referral_code: code,
          status: "active",
        } as any);
        if (!error) setReferralCode(code);
      }
      setLoading(false);
    };
    init();
  }, [user]);

  const referralUrl = `${window.location.origin}/?ref=${referralCode}`;
  const convertedCount = referrals.filter(r => r.status === "converted").length;

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success("Link copiado!");
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Programa de Indicação" description="Indique amigos e ganhe descontos na Case Lab" />
      <TopBar />
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading font-bold text-2xl mb-2">Programa de Indicação</h1>
          <p className="text-muted-foreground text-sm">Indique amigos e ambos ganham 10% de desconto!</p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { step: "1", title: "Compartilhe", desc: "Envie seu link para amigos" },
            { step: "2", title: "Amigo compra", desc: "Ele ganha 10% na primeira compra" },
            { step: "3", title: "Você ganha", desc: "Cupom de 10% para sua próxima compra" },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                {s.step}
              </div>
              <p className="text-xs font-bold">{s.title}</p>
              <p className="text-[10px] text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Referral Link */}
        {loading ? (
          <p className="text-center text-muted-foreground">Carregando...</p>
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl p-4 mb-6">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Seu link de indicação:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={referralUrl}
                  readOnly
                  className="flex-1 px-3 py-2.5 rounded-lg border border-input bg-muted text-sm font-mono"
                />
                <button onClick={copyLink} className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-1.5">
                  <Copy className="w-4 h-4" /> Copiar
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold">{referrals.length}</p>
                <p className="text-xs text-muted-foreground">Indicações</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold">{convertedCount}</p>
                <p className="text-xs text-muted-foreground">Convertidas</p>
              </div>
            </div>

            {/* Share buttons */}
            <div className="flex gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`🎁 Use meu link e ganhe 10% de desconto na Case Lab! ${referralUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 text-white py-3 rounded-xl text-sm font-bold text-center hover:bg-green-600 transition-colors"
              >
                Compartilhar no WhatsApp
              </a>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
