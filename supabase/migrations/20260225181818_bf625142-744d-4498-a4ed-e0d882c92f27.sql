
-- Add shipping/billing info to orders
ALTER TABLE public.orders
  ADD COLUMN customer_name text NULL,
  ADD COLUMN customer_email text NULL,
  ADD COLUMN customer_phone text NULL,
  ADD COLUMN customer_cpf text NULL,
  ADD COLUMN shipping_cep text NULL,
  ADD COLUMN shipping_address text NULL,
  ADD COLUMN shipping_number text NULL,
  ADD COLUMN shipping_complement text NULL,
  ADD COLUMN shipping_neighborhood text NULL,
  ADD COLUMN shipping_city text NULL,
  ADD COLUMN shipping_state text NULL,
  ADD COLUMN stripe_session_id text NULL,
  ADD COLUMN payment_status text NOT NULL DEFAULT 'pending';
