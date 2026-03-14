-- DDL para la tabla de tracking de media por usuario en Supabase.
-- Regla clave: solo se persisten referencias (media_id, user_id) y estados de tracking.
-- No se duplican títulos, descripciones ni imágenes de la media.

create table if not exists public.user_media_tracking (
  -- Referencia al usuario autenticado (Supabase Auth UUID)
  user_id uuid not null references auth.users (id) on delete cascade,

  -- Identificador de la media en nuestro dominio (MediaId),
  -- basado en el ID externo del proveedor con prefijo (tmdb_*, igdb_*, etc.)
  media_id text not null,

  -- Estados de tracking mínimos
  is_favorite boolean not null default false,
  is_watched boolean not null default false,
  is_planned boolean not null default false,

  -- Datos adicionales de tracking opcionales
  rating integer,
  progress_minutes integer,

  -- Metadatos de auditoría
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Clave compuesta: un usuario solo puede tener un estado por media
  constraint user_media_tracking_pkey primary key (user_id, media_id)
);

-- Opcional: actualizar automáticamente updated_at en cambios
create trigger set_timestamp_user_media_tracking
before update on public.user_media_tracking
for each row
execute function public.set_current_timestamp_updated_at();

