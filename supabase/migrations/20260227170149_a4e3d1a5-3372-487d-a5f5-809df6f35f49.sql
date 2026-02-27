
-- Add shipping calculation columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_carrier text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_service text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_estimated_days integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_original_cost numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0;
