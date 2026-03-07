
CREATE POLICY "Admin delete profiles" ON public.profiles FOR DELETE TO authenticated USING (is_admin());
CREATE POLICY "Admin update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (is_admin());
