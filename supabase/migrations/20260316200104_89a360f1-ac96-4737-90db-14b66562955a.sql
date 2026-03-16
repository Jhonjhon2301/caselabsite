-- Campos fiscais adicionais para produtos e clientes B2B
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS fiscal_product_code text;

ALTER TABLE public.b2b_customers
  ADD COLUMN IF NOT EXISTS indicador_ie integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS state_registration text,
  ADD COLUMN IF NOT EXISTS address_cep text,
  ADD COLUMN IF NOT EXISTS address_street text,
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS address_neighborhood text,
  ADD COLUMN IF NOT EXISTS address_city text,
  ADD COLUMN IF NOT EXISTS address_state text;