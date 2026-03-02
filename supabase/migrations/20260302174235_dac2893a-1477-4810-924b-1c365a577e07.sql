
-- =============================================
-- B2B CUSTOMERS
-- =============================================
CREATE TABLE public.b2b_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  cnpj text,
  contact_name text,
  contact_phone text,
  contact_email text,
  pricing_tier text NOT NULL DEFAULT 'standard',
  discount_percent numeric NOT NULL DEFAULT 0,
  min_order_quantity integer NOT NULL DEFAULT 10,
  is_approved boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.b2b_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage b2b customers" ON public.b2b_customers FOR ALL USING (is_admin());
CREATE POLICY "Users read own b2b profile" ON public.b2b_customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own b2b profile" ON public.b2b_customers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own b2b profile" ON public.b2b_customers FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_b2b_customers_updated_at BEFORE UPDATE ON public.b2b_customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- B2B QUOTES (Orçamentos B2B)
-- =============================================
CREATE TABLE public.b2b_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  b2b_customer_id uuid REFERENCES public.b2b_customers(id) ON DELETE CASCADE NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  admin_notes text,
  valid_until timestamptz,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.b2b_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage b2b quotes" ON public.b2b_quotes FOR ALL USING (is_admin());
CREATE POLICY "B2B users read own quotes" ON public.b2b_quotes FOR SELECT
  USING (EXISTS (SELECT 1 FROM b2b_customers WHERE b2b_customers.id = b2b_quotes.b2b_customer_id AND b2b_customers.user_id = auth.uid()));
CREATE POLICY "B2B users create own quotes" ON public.b2b_quotes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM b2b_customers WHERE b2b_customers.id = b2b_quotes.b2b_customer_id AND b2b_customers.user_id = auth.uid()));

CREATE TRIGGER update_b2b_quotes_updated_at BEFORE UPDATE ON public.b2b_quotes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- PRODUCTION QUEUE
-- =============================================
CREATE TABLE public.production_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'waiting_art',
  designer_id uuid,
  designer_name text,
  art_approved_at timestamptz,
  production_started_at timestamptz,
  production_completed_at timestamptz,
  shipped_at timestamptz,
  priority integer NOT NULL DEFAULT 0,
  notes text,
  customer_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.production_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage production queue" ON public.production_queue FOR ALL USING (is_admin());

CREATE TRIGGER update_production_queue_updated_at BEFORE UPDATE ON public.production_queue
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- VOLUME DISCOUNT TIERS
-- =============================================
CREATE TABLE public.volume_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_quantity integer NOT NULL,
  max_quantity integer,
  discount_percent numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.volume_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage volume discounts" ON public.volume_discounts FOR ALL USING (is_admin());
CREATE POLICY "Anyone can read volume discounts" ON public.volume_discounts FOR SELECT USING (true);

-- Insert default tiers
INSERT INTO public.volume_discounts (min_quantity, max_quantity, discount_percent) VALUES
  (10, 24, 5),
  (25, 49, 10),
  (50, 99, 15),
  (100, NULL, 20);
