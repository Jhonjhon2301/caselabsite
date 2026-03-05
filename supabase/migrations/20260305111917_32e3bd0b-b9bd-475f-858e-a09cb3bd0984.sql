
-- Drop restrictive policies on site_settings
DROP POLICY IF EXISTS "Admin manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admin manage site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can read site settings"
ON public.site_settings
FOR SELECT
TO public
USING (true);
