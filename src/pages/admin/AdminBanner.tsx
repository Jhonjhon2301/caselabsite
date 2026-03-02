import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, ImageIcon, Trash2, Plus, GripVertical, Gift, Mail } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface BannerConfig {
  banner_mode: "interactive" | "fixed";
  banner_image_url: string;
  marquee_text: string;
  countdown_end: string;
  promo_title: string;
  promo_subtitle: string;
  cta_text: string;
  cta_link: string;
  slide_interval: number;
  interactive_images: string[];
}

const defaultConfig: BannerConfig = {
  banner_mode: "interactive",
  banner_image_url: "",
  marquee_text: "MELHORES OFERTAS DO ANO • GARRAFAS PERSONALIZADAS • FRETE GRÁTIS ACIMA DE R$299",
  countdown_end: "",
  promo_title: "PISCOU, PERDEU",
  promo_subtitle: "Garrafas com desconto + MIMO!",
  cta_text: "COMPRAR AGORA",
  cta_link: "#produtos",
  slide_interval: 8,
  interactive_images: [],
};

export default function AdminBanner() {
  const [config, setConfig] = useState<BannerConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero_banner")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const v = data.value as unknown as Partial<BannerConfig>;
          setConfig((prev) => ({ ...prev, ...v }));
        }
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: "hero_banner", value: config as unknown as Json, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner atualizado!" });
    }
    setSaving(false);
  };

  const handleImageUpload = async (file: File, target: "banner" | "interactive") => {
    setUploading(target);
    const ext = file.name.split(".").pop();
    const path = `banner/${target}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    if (target === "banner") {
      setConfig((prev) => ({ ...prev, banner_image_url: urlData.publicUrl }));
    } else {
      setConfig((prev) => ({ ...prev, interactive_images: [...prev.interactive_images, urlData.publicUrl] }));
    }
    setUploading(null);
    toast({ title: "Imagem enviada!" });
  };

  const removeInteractiveImage = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      interactive_images: prev.interactive_images.filter((_, i) => i !== index),
    }));
  };

  const update = (field: keyof BannerConfig, value: any) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  const isInteractive = config.banner_mode === "interactive";

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Banner Principal</h1>
          <p className="text-sm text-muted-foreground">Configure o banner da página inicial</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Mode Toggle */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-bold">Modo do Banner</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {isInteractive ? "Interativo — carrossel de garrafas com rotação automática" : "Fixo — uma única arte de banner"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${!isInteractive ? "text-primary" : "text-muted-foreground"}`}>Fixo</span>
              <Switch
                checked={isInteractive}
                onCheckedChange={(checked) => update("banner_mode", checked ? "interactive" : "fixed")}
              />
              <span className={`text-xs font-bold ${isInteractive ? "text-primary" : "text-muted-foreground"}`}>Interativo</span>
            </div>
          </div>
        </div>

        {/* Fixed Banner Image */}
        {!isInteractive && (
          <div className="space-y-2">
            <Label>Arte do Banner Fixo</Label>
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="bg-muted rounded-md px-3 py-2 text-xs text-muted-foreground">
                <strong>Medidas recomendadas:</strong> 1920 × 600px (desktop) — formato 16:5, landscape.
              </div>
              {config.banner_image_url ? (
                <div className="relative">
                  <img src={config.banner_image_url} alt="Banner atual" className="w-full max-h-64 object-cover rounded-md" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => update("banner_image_url", "")}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground bg-muted/50 rounded-md">
                  <ImageIcon className="w-10 h-10" />
                </div>
              )}
              <label className="flex items-center justify-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline py-2">
                <Upload className="w-4 h-4" />
                {uploading === "banner" ? "Enviando..." : "Enviar arte do banner"}
                <input type="file" accept="image/*" className="hidden" disabled={!!uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "banner"); }} />
              </label>
            </div>
          </div>
        )}

        {/* Interactive Banner Images */}
        {isInteractive && (
          <div className="space-y-2">
            <Label>Imagens das Garrafas (Modo Interativo)</Label>
            <div className="border border-border rounded-lg p-4 space-y-3">
              <div className="bg-muted rounded-md px-3 py-2 text-xs text-muted-foreground">
                Envie as imagens das garrafas. Serão exibidas em grupos de 3. Se não houver imagens customizadas, usaremos as garrafas padrão.
              </div>

              {config.interactive_images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {config.interactive_images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt={`Garrafa ${i + 1}`} className="h-28 w-full object-contain rounded-lg border border-border bg-muted/30 p-1" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeInteractiveImage(i)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <span className="absolute bottom-1 left-1 bg-foreground/80 text-background text-[9px] font-bold px-1.5 rounded">{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center justify-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline py-2 border-2 border-dashed border-border rounded-lg">
                <Plus className="w-4 h-4" />
                {uploading === "interactive" ? "Enviando..." : "Adicionar imagem de garrafa"}
                <input type="file" accept="image/*" className="hidden" disabled={!!uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, "interactive"); }} />
              </label>

              {/* Slide interval */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label>Tempo de rotação (segundos)</Label>
                <Input
                  type="number"
                  min={3}
                  max={30}
                  value={config.slide_interval}
                  onChange={(e) => update("slide_interval", Math.max(3, Math.min(30, parseInt(e.target.value) || 8)))}
                />
                <p className="text-xs text-muted-foreground">
                  Tempo que cada grupo de garrafas fica visível antes de trocar (3 a 30 segundos).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Promo title */}
        <div className="space-y-2">
          <Label>Título da promoção</Label>
          <Input value={config.promo_title} onChange={(e) => update("promo_title", e.target.value)} placeholder="Ex: PISCOU, PERDEU" />
        </div>

        {/* Promo subtitle */}
        <div className="space-y-2">
          <Label>Subtítulo da promoção</Label>
          <Input value={config.promo_subtitle} onChange={(e) => update("promo_subtitle", e.target.value)} placeholder="Ex: Garrafas com desconto + MIMO!" />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Texto do botão (CTA)</Label>
            <Input value={config.cta_text} onChange={(e) => update("cta_text", e.target.value)} placeholder="COMPRAR AGORA" />
          </div>
          <div className="space-y-2">
            <Label>Link do botão</Label>
            <Input value={config.cta_link} onChange={(e) => update("cta_link", e.target.value)} placeholder="#produtos" />
          </div>
        </div>

        {/* Countdown */}
        <div className="space-y-2">
          <Label>Data/hora fim do countdown</Label>
          <Input
            type="datetime-local"
            value={config.countdown_end ? config.countdown_end.slice(0, 16) : ""}
            onChange={(e) => update("countdown_end", e.target.value ? new Date(e.target.value).toISOString() : "")}
          />
          <p className="text-xs text-muted-foreground">Deixe vazio para usar um countdown automático de 6 horas.</p>
        </div>

        {/* Marquee text */}
        <div className="space-y-2">
          <Label>Texto da faixa preta (marquee)</Label>
          <Input value={config.marquee_text} onChange={(e) => update("marquee_text", e.target.value)} placeholder="Texto que roda na faixa preta..." />
          <p className="text-xs text-muted-foreground">Use " • " para separar os itens.</p>
        </div>
      </div>

      {/* ===== POPUP DE LEAD ===== */}
      <PopupSettings />

      {/* ===== PROGRAMA DE INDICAÇÃO ===== */}
      <ReferralSettings />
    </div>
  );
}

/* ===== Popup Lead Config ===== */
function PopupSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState({
    enabled: true,
    delay_seconds: 15,
    title: "Ganhe 10% OFF",
    subtitle: "na sua primeira compra!",
    coupon_code: "BEMVINDO10",
    discount_label: "10%",
    button_text: "Quero meu cupom de 10%",
  });

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "lead_popup").single()
      .then(({ data }) => {
        if (data?.value) setCfg((prev) => ({ ...prev, ...(data.value as any) }));
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      { key: "lead_popup", value: cfg as unknown as Json, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) toast({ title: "Erro ao salvar", variant: "destructive" });
    else toast({ title: "Popup atualizado!" });
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-bold">Popup de Captação (Lead)</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={cfg.enabled} onCheckedChange={(v) => setCfg({ ...cfg, enabled: v })} />
            <span className="text-xs text-muted-foreground">{cfg.enabled ? "Ativo" : "Desativado"}</span>
          </div>
          <Button size="sm" onClick={save} disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Subtítulo</Label>
          <Input value={cfg.subtitle} onChange={(e) => setCfg({ ...cfg, subtitle: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Código do Cupom</Label>
          <Input value={cfg.coupon_code} onChange={(e) => setCfg({ ...cfg, coupon_code: e.target.value.toUpperCase() })} />
          <p className="text-[10px] text-muted-foreground">Deve existir na aba Cupons</p>
        </div>
        <div className="space-y-2">
          <Label>Texto do Botão</Label>
          <Input value={cfg.button_text} onChange={(e) => setCfg({ ...cfg, button_text: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Atraso (segundos)</Label>
          <Input type="number" min="1" value={cfg.delay_seconds} onChange={(e) => setCfg({ ...cfg, delay_seconds: parseInt(e.target.value) || 15 })} />
        </div>
      </div>
    </div>
  );
}

/* ===== Referral Program Config ===== */
function ReferralSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState({
    discount_percent: 10,
  });

  useEffect(() => {
    supabase.from("site_settings").select("value").eq("key", "referral_program").single()
      .then(({ data }) => {
        if (data?.value) setCfg((prev) => ({ ...prev, ...(data.value as any) }));
      });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert(
      { key: "referral_program", value: cfg as unknown as Json, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    if (error) toast({ title: "Erro ao salvar", variant: "destructive" });
    else toast({ title: "Indicação atualizada!" });
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h2 className="font-heading text-lg font-bold">Programa de Indicação</h2>
        </div>
        <Button size="sm" onClick={save} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Desconto para indicador e indicado (%)</Label>
          <Input
            type="number"
            min="1"
            max="100"
            value={cfg.discount_percent}
            onChange={(e) => setCfg({ ...cfg, discount_percent: parseInt(e.target.value) || 10 })}
          />
          <p className="text-[10px] text-muted-foreground">Percentual de desconto que ambos recebem</p>
        </div>
      </div>
    </div>
  );
}
