
-- Add stock and measurements to products
ALTER TABLE public.products 
  ADD COLUMN stock_quantity integer NOT NULL DEFAULT 0,
  ADD COLUMN measurements text NULL;

-- Add position to user_roles for sub-roles within admin
ALTER TABLE public.user_roles 
  ADD COLUMN position text NULL;

-- Create expenses table for financial system
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  category text NULL,
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read expenses" ON public.expenses FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin insert expenses" ON public.expenses FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin update expenses" ON public.expenses FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin delete expenses" ON public.expenses FOR DELETE USING (public.is_admin());

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Update current admin user to CEO position
UPDATE public.user_roles SET position = 'ceo' WHERE role = 'admin';
