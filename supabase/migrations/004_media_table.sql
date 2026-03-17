-- Media table for storing media metadata
-- This table stores cached metadata from external APIs (TMDB, IGDB)
-- Only stores IDs and essential metadata to avoid duplication

create table if not exists public.media (
  -- Media ID in our domain (MediaId)
  -- Format: "tmdb_*" or "igdb_*"
  id text not null primary key,

  -- Media type
  type text not null check (type in ('movie', 'tv', 'game')),

  -- Basic metadata
  title text not null,
  original_title text,
  release_year integer,
  runtime_minutes integer,

  -- External API metadata (optional, for reference)
  external_data jsonb,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create trigger for updated_at
create trigger set_timestamp_media
before update on public.media
for each row
execute function public.set_current_timestamp_updated_at();

-- RLS policies
alter table public.media enable row level security;

-- Media is publicly readable
create policy "Media is viewable by everyone."
on public.media
for select
using (true);

-- Only authenticated users can insert/update media (via backend services)
create policy "Authenticated users can manage media."
on public.media
for all
to authenticated
using (true)
with check (true);

-- Indexes for performance
create index if not exists media_type_idx on public.media using btree (type);
create index if not exists media_title_idx on public.media using gin (to_tsvector('english', title));
