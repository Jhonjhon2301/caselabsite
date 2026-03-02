-- Add new profile fields for registration
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS gender text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS instagram text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS address_cep text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS address_street text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS address_number text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS address_complement text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS address_neighborhood text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS address_city text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS address_state text DEFAULT NULL;