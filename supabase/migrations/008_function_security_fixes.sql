-- Security fixes: Add SET search_path = '' to all SECURITY DEFINER functions
-- This prevents search_path exploitation attacks

-- Fix confirm_email_with_token
CREATE OR REPLACE FUNCTION public.confirm_email_with_token(token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  verification_record RECORD;
BEGIN
  SELECT * INTO verification_record
  FROM email_verifications
  WHERE token = confirm_email_with_token.token
    AND expires_at > NOW()
    AND confirmed_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  UPDATE email_verifications
  SET confirmed_at = NOW()
  WHERE id = verification_record.id;
  
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = verification_record.user_id;
  
  RETURN TRUE;
END;
$$;

-- Fix create_email_verification
CREATE OR REPLACE FUNCTION public.create_email_verification(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_token TEXT;
  expires_at TIMESTAMPTZ;
BEGIN
  new_token := encode(gen_random_bytes(32), 'hex');
  expires_at := NOW() + INTERVAL '24 hours';
  
  INSERT INTO email_verifications (user_id, token, expires_at)
  VALUES (user_id, new_token, expires_at);
  
  RETURN new_token;
END;
$$;

-- Fix get_user_by_email
CREATE OR REPLACE FUNCTION public.get_user_by_email(email_param text)
RETURNS TABLE(id uuid, email text, email_confirmed_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.email_confirmed_at
  FROM auth.users u
  WHERE u.email = email_param;
END;
$$;
