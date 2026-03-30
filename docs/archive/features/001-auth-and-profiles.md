# Feature: Auth & Profiles

Esta feature implementa el flujo de autenticación con Supabase (Email + Google OAuth), la creación automática de perfiles sociales de usuario y la vista agregada de estadísticas globales de consumo (`user_global_stats`), siguiendo la propuesta `002-auth-and-profiles.md`.

## Esquema de Base de Datos

- Tabla `public.user_profiles`:
  - 1:1 con `auth.users`.
  - Campos: `first_name`, `last_name`, `username` único normalizado, `avatar_url`, `banner_url`, timestamps.
  - RLS:
    - Lectura abierta (`select` para todos).
    - `insert`/`update` restringidos a `auth.uid() = id`.
- Tabla `public.user_media_tracking`:
  - Extendida con la columna `media_type text` (`movie`, `tv`, `game`) y constraints + índices para consultas por `user_id` y `media_type`.
- Vista `public.user_global_stats`:
  - Agrega `progress_minutes` por `user_id` y `media_type`, exponiendo:
    - `total_movie_minutes`, `total_tv_minutes`, `total_game_minutes`, `total_minutes`.

## Triggers y Automatización

- Función `public.handle_new_user` (`security definer`):
  - Se ejecuta `AFTER INSERT` en `auth.users`.
  - Deriva `first_name` / `last_name` desde `raw_user_meta_data.full_name`.
  - Genera `username`:
    - Parte local del email → normalizada (solo `[a-z0-9]`).
    - En caso de colisión, añade sufijo aleatorio de 4 caracteres.
  - Inicializa `avatar_url` con la imagen de Google si existe.
- Trigger `on_auth_user_created`:
  - Conecta `auth.users` con `public.user_profiles` usando la función anterior.

## Modelos de Dominio

- `src/modules/shared/domain/media.ts`:
  - Añadido `UserGlobalStats` (totales de minutos por tipo y globales).
- `src/modules/social/domain/user-profile.ts`:
  - `UserProfile` para representar perfiles sociales.
  - `UserProfileWithStats` para composición de perfil + estadísticas agregadas.

## Integración de Infraestructura

- `SupabaseUserStatsRepository`:
  - Lee desde la vista `user_global_stats` y mapea a `UserGlobalStats`.
  - Mantiene el dominio aislado de detalles de Supabase (`Ports & Adapters`).

## Notas de Arquitectura

- La vista `user_global_stats` se apoya únicamente en `user_media_tracking` y su columna `media_type`, evitando inferencias a partir de `media_id`.
- Las RLS se aplican a nivel de tabla base (`user_media_tracking` y `user_profiles`); la vista hereda estas restricciones, manteniendo el principio de **Privacy First**.

