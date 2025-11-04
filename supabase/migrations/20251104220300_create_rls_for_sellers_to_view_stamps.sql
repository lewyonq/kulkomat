CREATE POLICY "Sellers can read all stamps" 
ON public.stamps
FOR SELECT
TO authenticated
USING (
   (EXISTS ( SELECT 1
   FROM sellers
  WHERE (sellers.id = auth.uid())))
);
