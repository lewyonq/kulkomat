-- Enable RLS for the contact_submissions table
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to insert into contact_submissions
CREATE POLICY "Allow authenticated users to insert contact submissions"
ON public.contact_submissions
FOR INSERT
TO authenticated
WITH CHECK (true);
