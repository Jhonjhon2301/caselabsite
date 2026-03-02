
-- Admin audit log for tracking all admin actions
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "Admin insert audit log" ON public.admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE INDEX idx_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);

-- Lead captures table
CREATE TABLE public.lead_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  phone text,
  source text DEFAULT 'popup',
  page_url text,
  coupon_code text,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage leads" ON public.lead_captures
  FOR ALL TO authenticated USING (is_admin());

CREATE POLICY "Anyone can insert leads" ON public.lead_captures
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Authenticated insert leads" ON public.lead_captures
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_leads_email ON public.lead_captures(email);
CREATE INDEX idx_leads_created ON public.lead_captures(created_at DESC);
