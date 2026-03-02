
-- Add CPF and phone to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text;

-- Add production_days to products (days to produce before shipping)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS production_days integer DEFAULT 3;

-- Add text_orientation to products (horizontal or vertical)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS text_orientation text DEFAULT 'horizontal';
