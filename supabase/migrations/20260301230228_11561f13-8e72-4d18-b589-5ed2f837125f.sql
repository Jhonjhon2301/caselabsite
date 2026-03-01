
-- Tabela de carrinhos abandonados
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid,
  customer_email text,
  customer_name text,
  customer_phone text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric NOT NULL DEFAULT 0,
  recovery_status text NOT NULL DEFAULT 'pending',
  recovery_attempts integer NOT NULL DEFAULT 0,
  last_recovery_at timestamptz,
  recovered_at timestamptz,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Admin pode gerenciar tudo
CREATE POLICY "Admin manage abandoned carts"
ON public.abandoned_carts FOR ALL
USING (is_admin());

-- Usuários autenticados podem ver/criar seus próprios carrinhos
CREATE POLICY "Users manage own abandoned carts"
ON public.abandoned_carts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role pode inserir/atualizar (para edge functions e guest checkout)
CREATE POLICY "Anon can insert abandoned carts"
ON public.abandoned_carts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anon can update own abandoned carts"
ON public.abandoned_carts FOR UPDATE
USING (session_id IS NOT NULL AND session_id = session_id);

-- Trigger de updated_at
CREATE TRIGGER update_abandoned_carts_updated_at
BEFORE UPDATE ON public.abandoned_carts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Tabela para log de automações pós-compra
CREATE TABLE public.order_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  automation_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage order automations"
ON public.order_automations FOR ALL
USING (is_admin());

-- Tabela para configurações de SEO por produto
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text;

-- Tabela site_settings já existe para SEO global
