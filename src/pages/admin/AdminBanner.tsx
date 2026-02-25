import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, ImageIcon } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface BannerConfig {
  banner_image_url: string;
  marquee_text: string;
}

const defaultConfig: BannerConfig = {
  banner_image_url: "",
  marquee_text: "GARRAFAS PERSONALIZADAS • QUALIDADE PREMIUM • ENTREGA PARA TODO BRASIL • SUA MARCA, SUA GARRAFA •",
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
          const v = data.value as unknown as BannerConfig;
          setConfig({
            banner_image_url: v.banner_image_url || "",
            marquee_text: v.marquee_text || defaultConfig.marquee_text,
          });
        }
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: config as unknown as Json })
      .eq("key", "hero_banner");

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

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Banner Principal</h1>
          <p className="text-sm text-muted-foreground">Envie a arte pronta do banner e edite a faixa de texto</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Banner image */}
        <div className="space-y-2">
          <Label>Arte do Banner</Label>
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="bg-muted rounded-md px-3 py-2 text-xs text-muted-foreground">
              <strong>Medidas recomendadas:</strong> 1920 × 600px (desktop) — formato 16:5, landscape.
              Formatos aceitos: PNG, JPG, WEBP. Peso máximo: 2MB.
            </div>

            {config.banner_image_url ? (
              <img
                src={config.banner_image_url}
                alt="Banner atual"
                className="w-full max-h-64 object-cover rounded-md"
              />
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

        {/* Marquee text */}
        <div className="space-y-2">
          <Label>Texto da faixa preta (marquee)</Label>
          <Input
            value={config.marquee_text}
            onChange={(e) => setConfig((prev) => ({ ...prev, marquee_text: e.target.value }))}
            placeholder="Texto que roda na faixa preta..."
          />
          <p className="text-xs text-muted-foreground">
            Use " • " para separar os itens. Ex: ITEM 1 • ITEM 2 • ITEM 3 •
          </p>
        </div>
      </div>
    </div>
  );
}
