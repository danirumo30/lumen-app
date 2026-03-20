-- Security fixes for password_resets table
-- Enable RLS and create secure policies

-- Enable RLS on password_resets table
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert password resets (for auth flow)
CREATE POLICY "Users can insert password resets"
ON public.password_resets
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Policy: Users can view their own password reset tokens
CREATE POLICY "Users can view their own password resets"
ON public.password_resets
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy: Users can delete their own password resets (when they use them)
CREATE POLICY "Users can delete their own password resets"
ON public.password_resets
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
);

-- Policy: Service role can manage all password resets (for admin/cleanup)
CREATE POLICY "Service role can manage all password resets"
ON public.password_resets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Enable RLS enforcement at database level
ALTER TABLE public.password_resets FORCE ROW LEVEL SECURITY;
