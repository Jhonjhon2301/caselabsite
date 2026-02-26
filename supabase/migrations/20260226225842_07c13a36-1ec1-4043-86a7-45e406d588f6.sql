
-- Add text position fields for customizable products
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS text_top numeric DEFAULT 42,
  ADD COLUMN IF NOT EXISTS text_left numeric DEFAULT 50;

-- Comment for clarity
COMMENT ON COLUMN public.products.text_top IS 'Vertical position (%) for custom text overlay';
COMMENT ON COLUMN public.products.text_left IS 'Horizontal position (%) for custom text overlay';
