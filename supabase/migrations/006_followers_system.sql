-- Tabla de relaciones de seguidores/seguidos
CREATE TABLE IF NOT EXISTS public.user_followers (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_followers_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT user_followers_no_self_follow CHECK (follower_id <> following_id)
);

-- RLS policies
ALTER TABLE public.user_followers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see who follows them and who they follow
CREATE POLICY "Users can view follow relationships"
ON public.user_followers
FOR SELECT
USING (
  auth.uid() = follower_id OR 
  auth.uid() = following_id
);

-- Policy: Users can create follow relationships
CREATE POLICY "Users can follow others"
ON public.user_followers
FOR INSERT
WITH CHECK (
  auth.uid() = follower_id
);

-- Policy: Users can unfollow
CREATE POLICY "Users can unfollow"
ON public.user_followers
FOR DELETE
USING (
  auth.uid() = follower_id
);

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(user_id uuid)
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.user_followers
    WHERE following_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(user_id uuid)
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.user_followers
    WHERE follower_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is following
CREATE OR REPLACE FUNCTION is_following(follower uuid, following uuid)
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT EXISTS (
      SELECT 1
      FROM public.user_followers
      WHERE follower_id = follower AND following_id = following
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
