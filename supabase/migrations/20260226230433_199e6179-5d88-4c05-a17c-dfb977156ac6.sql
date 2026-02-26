
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS text_rotation numeric DEFAULT 0;

COMMENT ON COLUMN public.products.text_rotation IS 'Rotation angle in degrees for custom text overlay (0=horizontal, 90=vertical, -90=vertical invertido)';
