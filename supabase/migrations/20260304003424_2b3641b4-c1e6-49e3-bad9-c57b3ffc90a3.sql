
-- 1. Allow admins to DELETE orders
CREATE POLICY "Admin delete orders"
ON public.orders
FOR DELETE
USING (is_admin());

-- 2. Add parent_id to categories for subcategory hierarchy
ALTER TABLE public.categories ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
