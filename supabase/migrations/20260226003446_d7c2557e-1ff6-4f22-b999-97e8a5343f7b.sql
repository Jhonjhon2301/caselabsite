ALTER TABLE public.products DROP COLUMN colors;
ALTER TABLE public.products ADD COLUMN variants jsonb DEFAULT '[]'::jsonb;