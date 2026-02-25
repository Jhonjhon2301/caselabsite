import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Upload, Image as ImageIcon } from "lucide-react";

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

const defaultConfig: BannerConfig = {
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
          setConfig({ ...defaultConfig, ...(data.value as unknown as BannerConfig) });
        }
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: config as unknown as import("@/integrations/supabase/types").Json })
      .eq("key", "hero_banner");

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner atualizado!" });
    }
    setSaving(false);
  };

  const handleImageUpload = async (field: "image1_url" | "image2_url", file: File) => {
    setUploading(field);
    const ext = file.name.split(".").pop();
    const path = `banner/${field}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setConfig((prev) => ({ ...prev, [field]: urlData.publicUrl }));
    setUploading(null);
    toast({ title: "Imagem enviada!" });
  };

  const update = (field: keyof BannerConfig, value: string) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Banner Principal</h1>
          <p className="text-sm text-muted-foreground">Personalize os textos e imagens do banner da loja</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Badge (etiqueta)</Label>
            <Input value={config.badge_text} onChange={(e) => update("badge_text", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Título linha 1</Label>
            <Input value={config.title_line1} onChange={(e) => update("title_line1", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Título linha 2 (destaque)</Label>
            <Input value={config.title_line2} onChange={(e) => update("title_line2", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea value={config.description} onChange={(e) => update("description", e.target.value)} rows={3} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Texto botão principal</Label>
            <Input value={config.cta_text} onChange={(e) => update("cta_text", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Texto botão secundário</Label>
            <Input value={config.cta2_text} onChange={(e) => update("cta2_text", e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Texto marquee (faixa inferior)</Label>
          <Input value={config.marquee_text} onChange={(e) => update("marquee_text", e.target.value)} />
        </div>

        {/* Image uploads */}
        <div className="grid gap-4 sm:grid-cols-2">
          {(["image1_url", "image2_url"] as const).map((field, idx) => (
            <div key={field} className="space-y-2">
              <Label>Imagem {idx + 1}</Label>
              <div className="border border-border rounded-lg p-4 space-y-3">
                {config[field] ? (
                  <img src={config[field]} alt={`Banner ${idx + 1}`} className="h-32 object-contain mx-auto" />
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 cursor-pointer text-sm font-medium text-primary hover:underline">
                  <Upload className="w-4 h-4" />
                  {uploading === field ? "Enviando..." : "Enviar imagem"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(field, file);
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
