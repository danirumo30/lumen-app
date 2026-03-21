-- Fix 1: Make profiles and tracking publicly viewable
-- Allows other users to see your movies, series, and videogames on your public profile

-- 1) Add is_public flag to user_profiles (default true for public profiles)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- 2) Update RLS policy for user_media_tracking to allow public viewing
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own tracking" ON public.user_media_tracking;

-- Create new policy: allow SELECT if the owner's profile is_public
-- This uses a subquery to check the is_public flag of the profile owner
CREATE POLICY "Public profiles tracking is viewable"
ON public.user_media_tracking
FOR SELECT
USING (
  -- Either the user owns the tracking, OR the owner's profile is public
  user_id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_media_tracking.user_id
    AND is_public = true
  )
);

-- 3) Ensure user_global_stats view works with public access
-- Since the view is based on user_media_tracking, it will inherit the RLS policy
-- But we need to make sure SELECT on the view is also public
DROP POLICY IF EXISTS "Public stats viewable by everyone" ON public.user_global_stats;
CREATE POLICY "Public stats viewable by everyone"
ON public.user_global_stats
FOR SELECT
USING (
  -- Either the user owns the stats, OR the owner's profile is public
  user_id = (SELECT auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_global_stats.user_id
    AND is_public = true
  )
);

-- 4) Create index on is_public for better query performance
CREATE INDEX IF NOT EXISTS user_profiles_is_public_idx
ON public.user_profiles (is_public)
WHERE is_public = false; -- Partial index only for private profiles
