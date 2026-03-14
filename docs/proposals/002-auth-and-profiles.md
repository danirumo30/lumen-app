# Proposal: Auth y Perfiles Sociales (Supabase Auth + Profiles + Stats)

## Intent

Definir el **modelo de autenticación y perfiles sociales** de Lumen sobre Supabase Auth, incluyendo:
- Login con **Email + Google OAuth**.
- Creación automática de un **perfil social** con campos enriquecidos (`first_name`, `last_name`, `username`, `avatar_url`, `banner_url`).
- Cálculo de **estadísticas globales de consumo de media por usuario** a través de una `VIEW` de Postgres (`user_global_stats`) basada en la tabla existente `user_media_tracking`.

El objetivo es que cada usuario autenticado tenga un perfil social consistente y que el sistema pueda calcular de forma eficiente el tiempo total invertido en películas, series y juegos.

## Scope

### In Scope
- Definir el **modelo de datos de perfil** de usuario (tabla `user_profiles` o equivalente en `public.*`) con:
  - `first_name`, `last_name`, `username` (único), `avatar_url`, `banner_url`.
- Establecer las reglas de **auto-registro** del perfil:
  - Mapeo de `full_name` de Google a `first_name` y `last_name`.
  - Uso del avatar de Google como `avatar_url` por defecto.
  - Generación del `username` inicial a partir de la parte local del email (ej: `pepe@gmail.com` → `pepe`).
- Definir la **automatización** vía **trigger de base de datos** sobre `auth.users` para crear el perfil al registrarse un usuario.
- Diseñar la **vista Postgres** `user_global_stats` que agregue, desde `user_media_tracking`, el tiempo total consumido por usuario y por tipo de media (películas, series, juegos).

### Out of Scope
- UI concreta de pantallas de login, registro o edición de perfil en Next.js.
- Políticas RLS detalladas de cada tabla (se asumirán patrones estándar de Supabase a definir en una propuesta específica de seguridad).
- Cálculo de rankings globales (se basarán posteriormente en `user_global_stats`, pero no se definen en esta propuesta).

## Approach

### 1. Autenticación (Supabase Auth)
- Utilizar **Supabase Auth** como fuente de verdad de identidad:
  - Habilitar login vía **Email/Password** y **Google OAuth**.
  - Confiar en los metadatos de `auth.users` para obtener:
    - `email`
    - `raw_user_meta_data.full_name`
    - `raw_user_meta_data.avatar_url` (Google)
- No se almacenarán contraseñas ni secretos fuera de Supabase Auth; el frontend (Next.js) utilizará el SDK de Supabase.

### 2. Tabla de Perfiles Sociales
- Crear una tabla de perfiles en el esquema `public`, inspirada en el patrón oficial de Supabase pero adaptada a las necesidades de Lumen:

Campos mínimos:
- `id uuid` (PK, FK a `auth.users.id`, `on delete cascade`).
- `first_name text`.
- `last_name text`.
- `username text unique not null` (restricción de unicidad + validación de longitud mínima).
- `avatar_url text` (por defecto, avatar de Google si existe).
- `banner_url text` (customizable por el usuario).
- `created_at timestamptz not null default now()`.
- `updated_at timestamptz not null default now()`.

Reglas de negocio:
- `username` debe ser **único** a nivel global.
- `username` inicial se genera a partir de la parte local del email (`local_part` antes de `@`), **normalizada** eliminando puntos, guiones y cualquier carácter no alfanumérico para obtener un handle limpio (ej: `juan.perez-99` → `juanperez99`).
- En caso de colisión (otro usuario ya tiene ese `username`), el sistema generará un nuevo `username` añadiendo un sufijo aleatorio de 4 caracteres al final (ej: `juanperez99_ab3x`), garantizando así que el registro no falle por la restricción de unicidad.

### 3. Lógica de Registro (Auto-fill) vía Trigger

Inspirándonos en el patrón oficial de Supabase (`handle_new_user` + trigger `on_auth_user_created`), se definirá:

- Una función `public.handle_new_user()` (o equivalente) que:
  - Se ejecute **después** de la inserción en `auth.users`.
  - Inserte en la tabla de perfiles:
    - `id = new.id`.
    - `first_name`, `last_name` derivados de `new.raw_user_meta_data->>'full_name'`.
      - Regla base: partir `full_name` en el primer espacio:
        - `first_name` = primer token.
        - `last_name` = resto (o vacío si no hay resto).
    - `username` inicial a partir de la parte local del email:
      - `base_username_raw = split_part(new.email, '@', 1)`.
      - `base_username` se obtiene aplicando una normalización que:
        - Convierte a minúsculas.
        - Elimina puntos (`.`), guiones (`-`) y cualquier carácter no alfanumérico, dejando solo `[a-z0-9]`.
        - Ejemplo: `juan.perez-99` → `juanperez99`.
      - Estrategia de colisiones (robusta en esta propuesta):
        - Antes de insertar, comprobar si `base_username` ya existe.
        - Si existe, generar un `username` alternativo concatenando un sufijo aleatorio de 4 caracteres `[a-z0-9]` (ej: `juanperez99_ab3x`) y reintentar la inserción.
    - `avatar_url` = `new.raw_user_meta_data->>'avatar_url'` (imagen de Google) si existe.
    - `banner_url` = `null` inicialmente.
  - Establezca `created_at` y `updated_at` con `now()`.

- Un trigger en `auth.users`:
  - `create trigger on_auth_user_created ... execute function public.handle_new_user();`
  - La función será `security definer` y ajustará `search_path` según las recomendaciones de Supabase para evitar problemas de permisos.

### 4. Vista `user_global_stats` sobre `user_media_tracking`

Punto de partida:
- Ya existe la tabla `public.user_media_tracking` con:
  - `user_id uuid` (FK a `auth.users.id`).
  - `media_id text` (con prefijos `tmdb_*`, `igdb_*`).
  - Flags de tracking (`is_favorite`, `is_watched`, `is_planned`).
  - `media_type text` (con dominio restringido a tipos de media del dominio, por ejemplo `movie`, `tv`, `game`).
  - `progress_minutes integer` (minutos de consumo).

Objetivo de la vista:
- Proveer, por usuario, el **total de minutos consumidos** diferenciando:
  - Películas (`movie`).
  - Series (`tv`).
  - Juegos (`game`, a futuro).

En esta propuesta, la vista se definirá a nivel de Postgres como:
- Una agregación sobre `user_media_tracking` que:
  - Sume `progress_minutes` por `user_id` y por **tipo de media** utilizando explícitamente la columna `media_type`.
  - Se apoye en que `media_type` es una columna normalizada en `user_media_tracking` (por ejemplo, con un dominio o `check constraint` que limite los valores a (`movie`, `tv`, `game`)), evitando heurísticas sobre el prefijo del `media_id` y permitiendo índices limpios y consultas más eficientes.

Estructura aproximada de la vista `user_global_stats`:
- Columnas:
  - `user_id uuid`.
  - `total_movie_minutes integer not null default 0`.
  - `total_tv_minutes integer not null default 0`.
  - `total_game_minutes integer not null default 0`.
  - Opcionalmente, un campo `total_minutes` como suma de los tres anteriores.

La vista se construirá de forma que:
- No duplique datos de media (solo agrega sobre `progress_minutes`).
- Pueda ser consumida por casos de uso de rankings y estadísticas sin recalcular sobre la tabla base en cada petición.

## Affected Areas

| Area                      | Impact   | Description                                                                                 |
|---------------------------|----------|---------------------------------------------------------------------------------------------|
| `docs/sql`                | New/Mod  | Nuevos scripts SQL para tabla de perfiles, trigger de auto-creación y vista `user_global_stats`. |
| `auth.users` (Supabase)   | Read/Ref | Se añade trigger `on_auth_user_created` que reacciona a nuevos registros de usuarios.       |
| `public.user_profiles`    | New      | Tabla de perfiles sociales vinculada 1:1 con `auth.users`.                                 |
| `public.user_media_tracking` | Read  | Fuente de datos para la vista `user_global_stats`.                                         |
| `user_global_stats` (VIEW)| New      | Vista agregada para minutos consumidos por tipo de media.                                  |

## Risks

| Risk                                                                                          | Likelihood | Mitigation                                                                                                       |
|-----------------------------------------------------------------------------------------------|-----------|------------------------------------------------------------------------------------------------------------------|
| Errores en la lógica de auto-fill de nombres (split de `full_name` poco robusto).            | Medium    | Mantener lógica simple y documentada; permitir edición manual posterior del perfil en la UI.                    |
| Colisiones de `username` cuando la parte local del email ya está tomada.                     | High      | Definir una estrategia incremental de resolución (sufijos numéricos) en una propuesta futura; validar unicidad. |
| Dependencia fuerte de metadatos de Google (`avatar_url`, `full_name`) que pueden faltar.     | Medium    | Definir valores por defecto (avatar genérico, first/last vacíos) cuando los metadatos no estén presentes.       |
| Posibles inconsistencias entre `user_media_tracking` y la vista `user_global_stats` si cambia el modelo de media_type. | Medium    | Encapsular la lógica de derivación de tipo de media en la vista o en funciones auxiliares; actualizar al cambiar el modelo. |
| Coste de mantenimiento del trigger de perfil si cambian los metadatos de `auth.users`.       | Low       | Documentar claramente el contrato actual y revisar cuando Supabase cambie sus payloads de OAuth.                |

## Success Criteria

- [ ] Existe una tabla de perfiles sociales (`public.user_profiles` o equivalente) con los campos requeridos: `first_name`, `last_name`, `username` único, `avatar_url`, `banner_url`.
- [ ] El `username` inicial se genera automáticamente a partir de la parte local del email en el momento de registro.
- [ ] El perfil se crea automáticamente mediante un **trigger de base de datos** sobre `auth.users` utilizando una función `handle_new_user` (o equivalente) con `security definer`.
- [ ] El avatar por defecto del perfil se inicializa con la imagen de Google (`avatar_url`) cuando exista.
- [ ] La vista `user_global_stats` está definida en Postgres y expone, para cada `user_id`, los totales de minutos consumidos para películas, series y juegos utilizando `progress_minutes` de `user_media_tracking`.
- [ ] La vista `user_global_stats` no duplica metadatos de media y se apoya exclusivamente en la tabla `user_media_tracking` como fuente para las métricas.

