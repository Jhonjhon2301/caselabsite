CREATE POLICY "Users read own fiscal notes" ON public.fiscal_notes FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = fiscal_notes.order_id 
    AND orders.user_id = auth.uid()
  )
);