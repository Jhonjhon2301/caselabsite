
CREATE TABLE public.shared_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage shared carts" ON public.shared_carts FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Anyone can read shared carts" ON public.shared_carts FOR SELECT USING (true);
