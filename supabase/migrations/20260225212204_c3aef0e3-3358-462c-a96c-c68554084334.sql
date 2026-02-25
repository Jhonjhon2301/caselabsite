
-- Table for manual/external sales
CREATE TABLE public.manual_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read manual sales" ON public.manual_sales FOR SELECT USING (is_admin());
CREATE POLICY "Admin insert manual sales" ON public.manual_sales FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin update manual sales" ON public.manual_sales FOR UPDATE USING (is_admin());
CREATE POLICY "Admin delete manual sales" ON public.manual_sales FOR DELETE USING (is_admin());

-- Add due_date column to expenses for scheduled payments
ALTER TABLE public.expenses ADD COLUMN due_date DATE;
-- Add status to track if expense is paid or pending
ALTER TABLE public.expenses ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
