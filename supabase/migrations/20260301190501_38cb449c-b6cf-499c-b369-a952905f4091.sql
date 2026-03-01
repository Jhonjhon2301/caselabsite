
-- Table to store issued fiscal notes
CREATE TABLE public.fiscal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  type TEXT NOT NULL DEFAULT 'nfe', -- nfe, nfce
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, authorized, cancelled, error
  focus_id TEXT, -- ID returned by Focus NFe
  focus_ref TEXT, -- Our reference sent to Focus NFe
  number TEXT, -- NF-e number after authorization
  series TEXT,
  access_key TEXT, -- Chave de acesso
  xml_url TEXT,
  pdf_url TEXT,
  cancel_xml_url TEXT,
  customer_name TEXT,
  customer_cpf TEXT,
  customer_email TEXT,
  total NUMERIC NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  error_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiscal_notes ENABLE ROW LEVEL SECURITY;

-- Only admins can manage fiscal notes
CREATE POLICY "Admin manage fiscal notes"
  ON public.fiscal_notes FOR ALL
  USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_fiscal_notes_updated_at
  BEFORE UPDATE ON public.fiscal_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
