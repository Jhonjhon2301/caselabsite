
-- =============================================
-- 1. Designer Drive: folders & files metadata
-- =============================================
CREATE TABLE public.designer_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.designer_folders(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.designer_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage designer folders" ON public.designer_folders
  FOR ALL USING (public.is_admin());

CREATE TABLE public.designer_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES public.designer_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  storage_path text NOT NULL,
  file_size bigint DEFAULT 0,
  mime_type text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.designer_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage designer files" ON public.designer_files
  FOR ALL USING (public.is_admin());

-- Storage bucket for designer uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('designer-files', 'designer-files', true);

CREATE POLICY "Admin upload designer files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'designer-files' AND public.is_admin());

CREATE POLICY "Admin delete designer files" ON storage.objects
  FOR DELETE USING (bucket_id = 'designer-files' AND public.is_admin());

CREATE POLICY "Anyone can view designer files" ON storage.objects
  FOR SELECT USING (bucket_id = 'designer-files');

-- =============================================
-- 2. Dynamic Roles: custom_positions table
-- =============================================
CREATE TABLE public.custom_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage custom positions" ON public.custom_positions
  FOR ALL USING (public.is_admin());

CREATE POLICY "Admins can read positions" ON public.custom_positions
  FOR SELECT USING (public.is_admin());

-- Seed default positions
INSERT INTO public.custom_positions (name, label, permissions) VALUES
  ('ceo', 'CEO — Acesso total', ARRAY['products','stock','orders','financial','coupons','categories','documents','banner','payments','reminders','notes','team','designer']),
  ('vendedor', 'Vendedor', ARRAY['products','stock','orders','coupons','documents','reminders','notes']),
  ('financeiro', 'Financeiro', ARRAY['financial']),
  ('estoquista', 'Estoquista', ARRAY['stock']),
  ('designer', 'Designer', ARRAY['designer']);

-- Trigger for updated_at
CREATE TRIGGER update_custom_positions_updated_at
  BEFORE UPDATE ON public.custom_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
