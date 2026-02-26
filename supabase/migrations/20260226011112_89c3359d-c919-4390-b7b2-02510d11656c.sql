ALTER TABLE public.products ADD COLUMN purchase_cost numeric NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN height_cm numeric NULL;
ALTER TABLE public.products ADD COLUMN circumference_cm numeric NULL;