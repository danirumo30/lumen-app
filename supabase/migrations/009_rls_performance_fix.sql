-- Performance fixes: auth.uid() wrapped in (select auth.uid()) for RLS
-- This prevents re-evaluation on each row (auth_rls_initplan fix)

-- user_media_tracking policies
DROP POLICY IF EXISTS "Users can view their own tracking" ON public.user_media_tracking;
CREATE POLICY "Users can view their own tracking"
ON public.user_media_tracking
FOR SELECT
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own tracking" ON public.user_media_tracking;
CREATE POLICY "Users can insert their own tracking"
ON public.user_media_tracking
FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own tracking" ON public.user_media_tracking;
CREATE POLICY "Users can update their own tracking"
ON public.user_media_tracking
FOR UPDATE
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

-- user_profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.user_profiles;
CREATE POLICY "Users can insert their own profile."
ON public.user_profiles
FOR INSERT
WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile." ON public.user_profiles;
CREATE POLICY "Users can update own profile."
ON public.user_profiles
FOR UPDATE
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

-- email_verifications policies
DROP POLICY IF EXISTS "Users can view their own verifications" ON public.email_verifications;
CREATE POLICY "Users can view their own verifications"
ON public.email_verifications
FOR SELECT
USING (user_id = (select auth.uid()));

-- user_followers policies
DROP POLICY IF EXISTS "Users can view follow relationships" ON public.user_followers;
CREATE POLICY "Users can view follow relationships"
ON public.user_followers
FOR SELECT
USING ((follower_id = (select auth.uid())) OR (following_id = (select auth.uid())));

DROP POLICY IF EXISTS "Users can follow others" ON public.user_followers;
CREATE POLICY "Users can follow others"
ON public.user_followers
FOR INSERT
WITH CHECK (follower_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can unfollow" ON public.user_followers;
CREATE POLICY "Users can unfollow"
ON public.user_followers
FOR DELETE
USING (follower_id = (select auth.uid()));

-- password_resets policies
DROP POLICY IF EXISTS "Users can view their own password resets" ON public.password_resets;
CREATE POLICY "Users can view their own password resets"
ON public.password_resets
FOR SELECT
USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert password resets" ON public.password_resets;
CREATE POLICY "Users can insert password resets"
ON public.password_resets
FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own password resets" ON public.password_resets;
CREATE POLICY "Users can delete their own password resets"
ON public.password_resets
FOR DELETE
USING (user_id = (select auth.uid()));

-- Add missing index for user_followers foreign key
CREATE INDEX IF NOT EXISTS user_followers_following_id_idx ON public.user_followers (following_id);

-- set_current_timestamp_updated_at with search_path fix
DROP TRIGGER IF EXISTS set_current_timestamp_updated_at ON public.user_media_tracking;
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS trigger
SET search_path = ''
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_current_timestamp_updated_at
BEFORE UPDATE ON public.user_media_tracking
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
