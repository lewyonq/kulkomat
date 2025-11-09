-- Enable RLS on the coupons table
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows sellers to insert new coupons
CREATE POLICY "Allow sellers to add coupons" 
ON public.coupons 
FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1
    FROM sellers
    WHERE sellers.id = auth.uid()
  )
);