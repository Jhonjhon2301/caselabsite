
ALTER TABLE public.internal_stock
  ADD COLUMN IF NOT EXISTS height_cm numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS circumference_cm numeric DEFAULT NULL;

ALTER TABLE public.shared_carts
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT NULL;
