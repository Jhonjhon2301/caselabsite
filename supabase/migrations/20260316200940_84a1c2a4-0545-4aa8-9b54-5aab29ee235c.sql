-- Add per-color stock and commercial note fields to internal stock items
ALTER TABLE public.internal_stock
  ADD COLUMN IF NOT EXISTS color_quantities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sales_note text;

-- Add linked product reference for quickly importing product/variant data into internal stock
ALTER TABLE public.internal_stock
  ADD COLUMN IF NOT EXISTS product_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'internal_stock_product_id_fkey'
  ) THEN
    ALTER TABLE public.internal_stock
      ADD CONSTRAINT internal_stock_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_internal_stock_product_id
  ON public.internal_stock(product_id);