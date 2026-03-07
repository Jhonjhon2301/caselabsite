import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, CreditCard, QrCode, Truck } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface PaymentConfig {
  active_gateway: "stripe";
  pix_enabled: boolean;
  card_enabled: boolean;
}

interface ShippingConfig {
  margin_type: "fixed" | "percentage";
  margin_value: number;
}

const defaultConfig: PaymentConfig = {
  active_gateway: "stripe",
  pix_enabled: true,
  card_enabled: true,
};

const defaultShipping: ShippingConfig = {
  margin_type: "fixed",
  margin_value: 0,
};

export default function AdminPayments() {
  const [config, setConfig] = useState<PaymentConfig>(defaultConfig);
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(defaultShipping);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      supabase.from("site_settings").select("value").eq("key", "payment_config").single(),
      supabase.from("site_settings").select("value").eq("key", "shipping_config").single(),
    ]).then(([payRes, shipRes]) => {
      if (payRes.data?.value) {
        const v = payRes.data.value as unknown as Partial<PaymentConfig>;
        setConfig((prev) => ({ ...prev, ...v }));
      }
      if (shipRes.data?.value) {
        const v = shipRes.data.value as unknown as Partial<ShippingConfig>;
        setShippingConfig((prev) => ({ ...prev, ...v }));
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const [payErr, shipErr] = await Promise.all([
      supabase.from("site_settings").upsert(
        { key: "payment_config", value: config as unknown as Json, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      ).then(r => r.error),
      supabase.from("site_settings").upsert(
        { key: "shipping_config", value: shippingConfig as unknown as Json, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      ).then(r => r.error),
    ]);
    if (payErr || shipErr) {
      toast({ title: "Erro ao salvar", description: (payErr || shipErr)?.message, variant: "destructive" });
    } else {
      toast({ title: "Configurações atualizadas!" });
    }
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Pagamentos & Frete</h1>
          <p className="text-sm text-muted-foreground">Configure gateways, métodos e margem de frete</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Gateway Info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Stripe</p>
              <p className="text-xs text-muted-foreground">Cartão de crédito/débito via Stripe</p>
            </div>
            <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">ATIVO</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Pagamento por <strong>Pix</strong> é feito manualmente via WhatsApp. Após o cliente pagar, marque o pedido como "Pago" na tela de Pedidos.
          </p>
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

        {/* Shipping Margin */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <Label className="text-base font-bold">Margem de Frete</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Adicione uma margem ao valor do frete para cobrir custos de embalagem/manuseio. Deixe 0 para cobrar o valor exato.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShippingConfig((prev) => ({ ...prev, margin_type: "fixed" }))}
              className={`p-3 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
                shippingConfig.margin_type === "fixed" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              Valor Fixo (R$)
            </button>
            <button
              type="button"
              onClick={() => setShippingConfig((prev) => ({ ...prev, margin_type: "percentage" }))}
              className={`p-3 rounded-xl border-2 text-center text-sm font-semibold transition-all ${
                shippingConfig.margin_type === "percentage" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              Percentual (%)
            </button>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">
              {shippingConfig.margin_type === "fixed" ? "Valor fixo a adicionar (R$)" : "Percentual a adicionar (%)"}
            </Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={shippingConfig.margin_value}
              onChange={(e) => setShippingConfig((prev) => ({ ...prev, margin_value: parseFloat(e.target.value) || 0 }))}
              placeholder={shippingConfig.margin_type === "fixed" ? "Ex: 5.00" : "Ex: 10"}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              {shippingConfig.margin_type === "fixed"
                ? `O cliente pagará o frete + R$${shippingConfig.margin_value.toFixed(2)}`
                : `O cliente pagará o frete + ${shippingConfig.margin_value}%`}
            </p>
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
