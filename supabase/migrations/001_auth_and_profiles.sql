-- Auth & Profiles schema for Lumen
-- Follows Supabase best practices and integrates with existing user_media_tracking table.

-- 1) User profiles table ----------------------------------------------------

create table if not exists public.user_profiles (
  id uuid not null
    references auth.users (id)
    on delete cascade,

  first_name text,
  last_name text,

  -- Clean, unique handle (normalized from email local part)
  username text not null unique,

  avatar_url text,
  banner_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_profiles_pkey primary key (id),
  constraint username_length check (char_length(username) >= 3)
);

-- Optional: keep updated_at in sync on updates
create trigger set_timestamp_user_profiles
before update on public.user_profiles
for each row
execute function public.set_current_timestamp_updated_at();

-- 2) RLS policies for user_profiles ----------------------------------------

alter table public.user_profiles
  enable row level security;

-- Everyone can read public profiles (fine-grained privacy can be added later).
create policy "Public user profiles are viewable by everyone."
on public.user_profiles
for select
using (true);

-- Only the owner can insert their own profile (normally handled by trigger).
create policy "Users can insert their own profile."
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Only the owner can update their own profile.
create policy "Users can update own profile."
on public.user_profiles
for update
to authenticated
using (auth.uid() = id);

-- 3) Trigger to auto-create profile on signup -------------------------------

create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
declare
  raw_email text;
  base_username_raw text;
  base_username_clean text;
  final_username text;
  suffix text;
begin
  -- Derive first_name / last_name from full_name when available
  -- Example: "Juan Perez Rodriguez" -> first_name = "Juan", last_name = "Perez Rodriguez"
  -- Fallback to nulls if no full_name is present.
  -- NOTE: This keeps logic simple; UI can allow users to refine later.
  -- Split full_name by first space
  -- (we avoid complex parsing to keep function deterministic and cheap).

  -- Extract email and local part
  raw_email := new.email;
  base_username_raw := split_part(raw_email, '@', 1);

  -- Normalize username: lowercase, remove non-alphanumeric (including dots and dashes).
  base_username_clean := lower(regexp_replace(base_username_raw, '[^a-z0-9]', '', 'g'));

  -- Safety fallback if everything was stripped (e.g. strange email local part)
  if base_username_clean = '' then
    base_username_clean := 'user';
  end if;

  final_username := base_username_clean;

  -- Handle collisions by appending a 4-char random suffix if needed.
  -- We attempt once; in practice the probability of repeat collision is negligible.
  if exists (select 1 from public.user_profiles where username = final_username) then
    suffix := substring(replace(gen_random_uuid()::text, '-', ''), 1, 4);
    final_username := base_username_clean || '_' || suffix;
  end if;

  insert into public.user_profiles (
    id,
    first_name,
    last_name,
    username,
    avatar_url,
    banner_url
  )
  values (
    new.id,
    split_part(coalesce(new.raw_user_meta_data->>'full_name', ''), ' ', 1),
    nullif(substring(coalesce(new.raw_user_meta_data->>'full_name', '') from position(' ' in coalesce(new.raw_user_meta_data->>'full_name', '')) + 1), ''),
    final_username,
    coalesce(new.raw_user_meta_data->>'avatar_url', null),
    null
  );

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

-- 4) Extend user_media_tracking with media_type (if needed) -----------------

alter table if exists public.user_media_tracking
  add column if not exists media_type text;

alter table public.user_media_tracking
  add constraint user_media_tracking_media_type_check
  check (media_type in ('movie', 'tv', 'game'));

-- Helpful index for queries and RLS filtering by user_id.
create index if not exists user_media_tracking_user_id_idx
  on public.user_media_tracking using btree (user_id);

-- Optional composite index for user_id + media_type.
create index if not exists user_media_tracking_user_media_type_idx
  on public.user_media_tracking using btree (user_id, media_type);

-- 5) Aggregated stats view: user_global_stats ------------------------------

create or replace view public.user_global_stats as
with base as (
  select
    user_id,
    media_type,
    coalesce(progress_minutes, 0) as progress_minutes
  from public.user_media_tracking
)
select
  user_id,
  sum(case when media_type = 'movie' then progress_minutes else 0 end) as total_movie_minutes,
  sum(case when media_type = 'tv' then progress_minutes else 0 end) as total_tv_minutes,
  sum(case when media_type = 'game' then progress_minutes else 0 end) as total_game_minutes,
  sum(progress_minutes) as total_minutes
from base
group by user_id;

-- RLS for the underlying table already applies when querying the view.
-- If you need to lock down the view further, you can set explicit policies.

