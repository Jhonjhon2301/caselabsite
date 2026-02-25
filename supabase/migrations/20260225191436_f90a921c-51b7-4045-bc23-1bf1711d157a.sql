
-- Table for site banner settings
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage site settings" ON public.site_settings FOR ALL USING (is_admin());

-- Seed default banner config
INSERT INTO public.site_settings (key, value) VALUES (
  'hero_banner',
  '{
    "badge_text": "GARRAFAS TÉRMICAS",
    "title_line1": "PERSONALIZE",
    "title_line2": "SUA GARRAFA",
    "description": "A cara da sua empresa, profissão ou estilo pessoal em uma garrafa térmica exclusiva.",
    "cta_text": "VER MODELOS",
    "cta2_text": "ORÇAMENTO",
    "marquee_text": "GARRAFAS PERSONALIZADAS • QUALIDADE PREMIUM • ENTREGA PARA TODO BRASIL • SUA MARCA, SUA GARRAFA •",
    "image1_url": "",
    "image2_url": ""
  }'::jsonb
);

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
