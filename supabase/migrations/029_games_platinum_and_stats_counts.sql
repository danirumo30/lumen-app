-- Migration 029: Add has_platinum for games and extend user_global_stats with counts
-- This enables tracking platinum trophies and counting media items

-- 1) Add has_platinum column to user_media_tracking for games
alter table public.user_media_tracking
add column if not exists has_platinum boolean not null default false;

-- Add index for faster lookups on platinum
create index if not exists idx_user_media_tracking_platinum 
on public.user_media_tracking(user_id) 
where has_platinum = true;

-- 2) Update user_global_stats view to include counts
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
),
counts as (
  select
    user_id,
    -- Count episodes watched (all tv media with progress > 0 or is_watched = true)
    (
      select count(*)
      from public.user_media_tracking umt
      where umt.user_id = combined.user_id
        and umt.media_type = 'tv'
        and (
          umt.media_id like 'tv_%_s%_e%'  -- Individual episodes
          or (umt.media_id ~ '^tv_[0-9]+$' and (umt.is_watched = true or umt.progress_minutes > 0))  -- Full series marked
        )
    ) as total_episodes_watched,
    -- Count movies watched
    (
      select count(*)
      from public.user_media_tracking umt
      where umt.user_id = combined.user_id
        and umt.media_type = 'movie'
        and umt.is_watched = true
    ) as total_movies_watched,
    -- Count games played (any game with play status set - using progress_minutes > 0 as proxy)
    (
      select count(*)
      from public.user_media_tracking umt
      where umt.user_id = combined.user_id
        and umt.media_type = 'game'
        and (umt.progress_minutes > 0 or umt.is_watched = true)
    ) as total_games_played,
    -- Count games with platinum
    (
      select count(*)
      from public.user_media_tracking umt
      where umt.user_id = combined.user_id
        and umt.media_type = 'game'
        and umt.has_platinum = true
    ) as total_games_platinum
  from combined
)
select
  combined.user_id,
  combined.total_movie_minutes,
  combined.total_tv_minutes,
  combined.total_game_minutes,
  combined.total_movie_minutes + combined.total_tv_minutes + combined.total_game_minutes as total_minutes,
  coalesce(counts.total_episodes_watched, 0) as total_episodes_watched,
  coalesce(counts.total_movies_watched, 0) as total_movies_watched,
  coalesce(counts.total_games_played, 0) as total_games_played,
  coalesce(counts.total_games_platinum, 0) as total_games_platinum
from combined
left join counts on combined.user_id = counts.user_id;
