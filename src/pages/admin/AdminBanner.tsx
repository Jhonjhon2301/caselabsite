import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, ImageIcon, Trash2 } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface BannerConfig {
  banner_image_url: string;
  marquee_text: string;
  countdown_end: string;
  promo_title: string;
  promo_subtitle: string;
  cta_text: string;
  cta_link: string;
}

const defaultConfig: BannerConfig = {
  banner_image_url: "",
  marquee_text: "MELHORES OFERTAS DO ANO • GARRAFAS PERSONALIZADAS • FRETE GRÁTIS ACIMA DE R$299",
  countdown_end: "",
  promo_title: "PISCOU, PERDEU",
  promo_subtitle: "Garrafas com desconto + MIMO!",
  cta_text: "COMPRAR AGORA",
  cta_link: "#produtos",
};

export default function AdminBanner() {
  const [config, setConfig] = useState<BannerConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banner/hero-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setConfig((prev) => ({ ...prev, banner_image_url: urlData.publicUrl }));
    setUploading(false);
    toast({ title: "Imagem enviada!" });
  };

  const update = (field: keyof BannerConfig, value: string) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Banner Principal</h1>
          <p className="text-sm text-muted-foreground">
            Configure todos os elementos do banner da página inicial
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Banner image override */}
        <div className="space-y-2">
          <Label>Arte do Banner (opcional — substitui o banner interativo)</Label>
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="bg-muted rounded-md px-3 py-2 text-xs text-muted-foreground">
              <strong>Medidas recomendadas:</strong> 1920 × 600px (desktop) — formato 16:5, landscape.
              Se enviada, substitui o banner interativo com garrafas.
            </div>

            {config.banner_image_url ? (
              <div className="relative">
                <img
                  src={config.banner_image_url}
                  alt="Banner atual"
                  className="w-full max-h-64 object-cover rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => update("banner_image_url", "")}
                >
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
              {uploading ? "Enviando..." : "Enviar arte do banner"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </label>
          </div>
        </div>

        {/* Promo title */}
        <div className="space-y-2">
          <Label>Título da promoção</Label>
          <Input
            value={config.promo_title}
            onChange={(e) => update("promo_title", e.target.value)}
            placeholder="Ex: PISCOU, PERDEU"
          />
        </div>

        {/* Promo subtitle */}
        <div className="space-y-2">
          <Label>Subtítulo da promoção</Label>
          <Input
            value={config.promo_subtitle}
            onChange={(e) => update("promo_subtitle", e.target.value)}
            placeholder="Ex: Garrafas com desconto + MIMO!"
          />
        </div>

        {/* CTA */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Texto do botão (CTA)</Label>
            <Input
              value={config.cta_text}
              onChange={(e) => update("cta_text", e.target.value)}
              placeholder="COMPRAR AGORA"
            />
          </div>
          <div className="space-y-2">
            <Label>Link do botão</Label>
            <Input
              value={config.cta_link}
              onChange={(e) => update("cta_link", e.target.value)}
              placeholder="#produtos"
            />
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
          <p className="text-xs text-muted-foreground">
            Deixe vazio para usar um countdown automático de 6 horas.
          </p>
        </div>

        {/* Marquee text */}
        <div className="space-y-2">
          <Label>Texto da faixa preta (marquee)</Label>
          <Input
            value={config.marquee_text}
            onChange={(e) => update("marquee_text", e.target.value)}
            placeholder="Texto que roda na faixa preta..."
          />
          <p className="text-xs text-muted-foreground">
            Use " • " para separar os itens. Ex: ITEM 1 • ITEM 2 • ITEM 3
          </p>
        </div>
      </div>
    </div>
  );
}
