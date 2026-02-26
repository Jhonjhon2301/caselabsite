
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;

COMMENT ON COLUMN public.products.discount_percent IS 'Discount percentage (0-100). When > 0, shows original price crossed out and discount badge.';
