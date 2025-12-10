-- Add INSERT, UPDATE, DELETE policies for categories (for allowed users)
CREATE POLICY "Allowed users can insert categories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can update categories"
ON public.categories FOR UPDATE
TO authenticated
USING (is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can delete categories"
ON public.categories FOR DELETE
TO authenticated
USING (is_allowed_user(auth.uid()));

-- Add INSERT, UPDATE, DELETE policies for subcategories (for allowed users)
CREATE POLICY "Allowed users can insert subcategories"
ON public.subcategories FOR INSERT
TO authenticated
WITH CHECK (is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can update subcategories"
ON public.subcategories FOR UPDATE
TO authenticated
USING (is_allowed_user(auth.uid()));

CREATE POLICY "Allowed users can delete subcategories"
ON public.subcategories FOR DELETE
TO authenticated
USING (is_allowed_user(auth.uid()));