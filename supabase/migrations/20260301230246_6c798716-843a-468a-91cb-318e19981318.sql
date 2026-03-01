
-- Fix: Remove overly permissive INSERT policy and replace with more specific ones
DROP POLICY IF EXISTS "Anon can insert abandoned carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Anon can update own abandoned carts" ON public.abandoned_carts;

-- Allow authenticated users to insert their own carts
CREATE POLICY "Authenticated insert abandoned carts"
ON public.abandoned_carts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own carts
CREATE POLICY "Authenticated update abandoned carts"
ON public.abandoned_carts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
