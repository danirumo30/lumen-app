-- Migration 030: Drop unused games_cache table
-- This table was created in migration 028 but never used by the application

DROP TABLE IF EXISTS public.games_cache;
