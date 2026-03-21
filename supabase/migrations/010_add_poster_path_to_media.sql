-- Add poster_path column to media table for storing poster images

alter table public.media
add column if not exists poster_path text;

-- Create index for faster poster lookups
create index if not exists media_poster_path_idx on public.media (poster_path);
