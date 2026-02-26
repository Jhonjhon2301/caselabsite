import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, CreditCard, QrCode, Wallet } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface PaymentConfig {
  active_gateway: "mercadopago" | "stripe" | "infinitepay";
  stripe_enabled: boolean;
  mercadopago_enabled: boolean;
  infinitepay_enabled: boolean;
  pix_enabled: boolean;
  card_enabled: boolean;
}

const defaultConfig: PaymentConfig = {
  active_gateway: "mercadopago",
  stripe_enabled: false,
  mercadopago_enabled: true,
  infinitepay_enabled: false,
  pix_enabled: true,
  card_enabled: true,
};

const gateways = [
  { id: "mercadopago" as const, label: "Mercado Pago", icon: Wallet, description: "Pix, cartão de crédito e débito" },
  { id: "stripe" as const, label: "Stripe", icon: CreditCard, description: "Cartão, Apple Pay, Google Pay" },
  { id: "infinitepay" as const, label: "InfinitePay", icon: QrCode, description: "Pix e cartão" },
];

export default function AdminPayments() {
  const [config, setConfig] = useState<PaymentConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "payment_config")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as unknown as Partial<PaymentConfig>;
          setConfig((prev) => ({ ...prev, ...v }));
        }
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: "payment_config", value: config as unknown as Json, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações de pagamento atualizadas!" });
    }
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Pagamentos</h1>
          <p className="text-sm text-muted-foreground">Configure os gateways e métodos de pagamento</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Active Gateway */}
        <div className="space-y-3">
          <Label className="text-base font-bold">Gateway Ativo</Label>
          <p className="text-sm text-muted-foreground">Selecione o gateway principal para processar pagamentos</p>
          <div className="grid gap-3">
            {gateways.map((gw) => {
              const Icon = gw.icon;
              const isActive = config.active_gateway === gw.id;
              return (
                <button
                  key={gw.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, active_gateway: gw.id }))}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    isActive ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>{gw.label}</p>
                    <p className="text-xs text-muted-foreground">{gw.description}</p>
                  </div>
                  {isActive && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">ATIVO</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <Label className="text-base font-bold">Métodos Aceitos</Label>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <QrCode className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Pix</p>
                <p className="text-xs text-muted-foreground">Pagamento instantâneo</p>
              </div>
            </div>
            <Switch checked={config.pix_enabled} onCheckedChange={(v) => setConfig((prev) => ({ ...prev, pix_enabled: v }))} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Cartão de Crédito/Débito</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard, Elo...</p>
              </div>
            </div>
            <Switch checked={config.card_enabled} onCheckedChange={(v) => setConfig((prev) => ({ ...prev, card_enabled: v }))} />
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4 text-xs text-muted-foreground">
          <strong>Nota:</strong> Para ativar um novo gateway, é necessário configurar as chaves de API correspondentes.
          Entre em contato se precisar de ajuda com a integração.
        </div>
      </div>
    </div>
  );
}
