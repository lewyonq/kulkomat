CREATE POLICY "Allow sellers to view coupons"
ON public.coupons
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM sellers
    WHERE sellers.id = auth.uid()
  )
);
