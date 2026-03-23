-- 028: Video Games Support
-- Adds games_cache table for IGDB metadata caching

-- 1) Create games_cache table for IGDB metadata
CREATE TABLE IF NOT EXISTS public.games_cache (
  igdb_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  cover_url TEXT,
  summary TEXT,
  genres TEXT[],
  platforms TEXT[],
  release_date DATE,
  rating NUMERIC(5,2),
  involved_companies TEXT[],
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.games_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cache
CREATE POLICY "Games cache is viewable by everyone"
ON public.games_cache
FOR SELECT
USING (true);

-- 2) Create index for cache invalidation
CREATE INDEX IF NOT EXISTS games_cache_cached_at_idx
ON public.games_cache (cached_at);

-- 3) Create function to upsert game into cache (helper for API)
CREATE OR REPLACE FUNCTION upsert_game_cache(
  p_igdb_id INTEGER,
  p_name TEXT,
  p_cover_url TEXT,
  p_summary TEXT,
  p_genres TEXT[],
  p_platforms TEXT[],
  p_release_date DATE,
  p_rating NUMERIC(5,2),
  p_involved_companies TEXT[]
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.games_cache (
    igdb_id, name, cover_url, summary, genres, platforms, 
    release_date, rating, involved_companies, cached_at
  ) VALUES (
    p_igdb_id, p_name, p_cover_url, p_summary, p_genres, p_platforms,
    p_release_date, p_rating, p_involved_companies, NOW()
  )
  ON CONFLICT (igdb_id) DO UPDATE SET
    name = EXCLUDED.name,
    cover_url = EXCLUDED.cover_url,
    summary = EXCLUDED.summary,
    genres = EXCLUDED.genres,
    platforms = EXCLUDED.platforms,
    release_date = EXCLUDED.release_date,
    rating = EXCLUDED.rating,
    involved_companies = EXCLUDED.involved_companies,
    cached_at = NOW();
END;
$$ LANGUAGE plpgsql;
