-- Migration 011: Create user_tv_progress table and update user_global_stats view
-- This enables instant statistics updates when marking all episodes of a TV series

-- 1) Create table to store aggregated TV progress per user per series
create table if not exists public.user_tv_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  tv_tmdb_id integer not null,
  total_minutes integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, tv_tmdb_id)
);

-- Enable RLS
alter table public.user_tv_progress enable row level security;

-- Policies: users can read their own progress
create policy "Users can view their own TV progress"
  on public.user_tv_progress for select
  using (auth.uid() = user_id);

-- Service role can update (for triggers)
create policy "Service role can manage TV progress"
  on public.user_tv_progress for all
  using (true)
  with check (true);

-- Index for faster lookups
create index if not exists user_tv_progress_user_idx on public.user_tv_progress(user_id);

-- 2) Create function to update TV progress when episodes change
create or replace function public.update_tv_progress_on_episode_change()
returns trigger as $$
declare
  v_user_id uuid;
  v_tmdb_id integer;
  v_total_minutes integer;
begin
  -- Determine user_id and tmdb_id from the affected row
  if TG_OP = 'DELETE' then
    v_user_id := OLD.user_id;
    -- Extract tmdb_id from media_id (format: tv_{tmdbId}_sX_eY)
    v_tmdb_id := substring(OLD.media_id from 'tv_(\d+)_s\d+_e\d+')::integer;
  else
    v_user_id := NEW.user_id;
    v_tmdb_id := substring(NEW.media_id from 'tv_(\d+)_s\d+_e\d+')::integer;
  end if;

  -- If media_id is a series (tv_{tmdbId}), not an episode, skip (or handle differently)
  if v_tmdb_id is null then
    -- Maybe it's a series-level record (tv_{tmdbId}), not an episode
    -- Try to parse as tv_{tmdbId} (no season/episode)
    if TG_OP = 'DELETE' then
      v_tmdb_id := substring(OLD.media_id from 'tv_(\d+)$')::integer;
    else
      v_tmdb_id := substring(NEW.media_id from 'tv_(\d+)$')::integer;
    end if;
    if v_tmdb_id is null then
      return null; -- Not a TV media, skip
    end if;
  end if;

  -- Calculate total minutes for this user and TV series from all episodes
  select coalesce(sum(progress_minutes), 0) into v_total_minutes
  from public.user_media_tracking
  where user_id = v_user_id
    and media_id like 'tv_' || v_tmdb_id || '_s%_e%'
    and is_watched = true;

  -- Upsert into user_tv_progress
  insert into public.user_tv_progress (user_id, tv_tmdb_id, total_minutes, updated_at)
  values (v_user_id, v_tmdb_id, v_total_minutes, now())
  on conflict (user_id, tv_tmdb_id)
  do update set
    total_minutes = excluded.total_minutes,
    updated_at = excluded.updated_at;

  return null;
end;
$$ language plpgsql security definer;

-- 3) Create trigger on user_media_tracking
drop trigger if exists update_tv_progress_trigger on public.user_media_tracking;
create trigger update_tv_progress_trigger
after insert or update or delete on public.user_media_tracking
for each row execute function public.update_tv_progress_on_episode_change();

-- 4) Update user_global_stats view to use user_tv_progress for TV minutes
create or replace view public.user_global_stats as
with tv_progress as (
  select
    user_id,
    sum(total_minutes) as total_tv_minutes
  from public.user_tv_progress
  group by user_id
),
other_progress as (
  select
    user_id,
    coalesce(sum(case when media_type = 'movie' then progress_minutes else 0 end), 0) as total_movie_minutes,
    coalesce(sum(case when media_type = 'game' then progress_minutes else 0 end), 0) as total_game_minutes
  from public.user_media_tracking
  where media_type in ('movie', 'game')
  group by user_id
),
combined as (
  select
    coalesce(tv_progress.user_id, other_progress.user_id) as user_id,
    coalesce(tv_progress.total_tv_minutes, 0) as total_tv_minutes,
    coalesce(other_progress.total_movie_minutes, 0) as total_movie_minutes,
    coalesce(other_progress.total_game_minutes, 0) as total_game_minutes
  from tv_progress
  full outer join other_progress on tv_progress.user_id = other_progress.user_id
)
select
  user_id,
  total_movie_minutes,
  total_tv_minutes,
  total_game_minutes,
  total_movie_minutes + total_tv_minutes + total_game_minutes as total_minutes
from combined;

-- 5) Backfill existing data into user_tv_progress
-- This may take a while for large datasets, but ensures consistency
insert into public.user_tv_progress (user_id, tv_tmdb_id, total_minutes)
select
  user_id,
  substring(media_id from 'tv_(\d+)_s\d+_e\d+')::integer as tv_tmdb_id,
  sum(progress_minutes) as total_minutes
from public.user_media_tracking
where media_type = 'tv'
  and media_id like 'tv_%_s%_e%'
  and is_watched = true
group by user_id, tv_tmdb_id
on conflict (user_id, tv_tmdb_id)
do update set
  total_minutes = excluded.total_minutes,
  updated_at = now();