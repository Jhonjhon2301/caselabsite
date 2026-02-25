
-- Table for recurring/fixed expenses
CREATE TABLE public.fixed_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  recurrence TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read fixed expenses" ON public.fixed_expenses FOR SELECT USING (is_admin());
CREATE POLICY "Admin insert fixed expenses" ON public.fixed_expenses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin update fixed expenses" ON public.fixed_expenses FOR UPDATE USING (is_admin());
CREATE POLICY "Admin delete fixed expenses" ON public.fixed_expenses FOR DELETE USING (is_admin());
