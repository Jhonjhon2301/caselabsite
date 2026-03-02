
-- Create internal stock table for private inventory management
CREATE TABLE public.internal_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  location TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_stock ENABLE ROW LEVEL SECURITY;

-- Only admins can manage internal stock
CREATE POLICY "Admin manage internal stock"
ON public.internal_stock
FOR ALL
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_internal_stock_updated_at
BEFORE UPDATE ON public.internal_stock
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
