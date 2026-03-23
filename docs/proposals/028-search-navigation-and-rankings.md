# Proposal: 028 - Search, Navigation & Rankings

## Intent

Implementar un sistema completo de búsqueda unificada que permita a los usuarios buscar películas, series, videojuegos y otros usuarios desde una única interfaz, con filtros avanzados y ordenamiento. Adicionalmente, implementar rankings globales y por categoría que muestren a los usuarios más activos.

## Scope

### In Scope
- **Búsqueda unificada**: Barra de búsqueda que busque en TMDB (películas/series), IGDB (juegos) y usuarios de Lumen
- **Filtros por tipo**: Toggle chips para filtrar por Movies, TV, Games, Users
- **Filtros avanzados por categoría**:
  - Movies: género, año, rating
  - TV: género, año, status
  - Games: género, plataforma, año
  - Users: username, país
- **Ordenamiento**: Por relevancia, rating, año, popularity
- **Resultados en tiempo real**: Debounce de 300ms, mostrar mientras se escribe
- **Historial de búsquedas**: Guardar últimas 10 búsquedas del usuario
- **Rankings globales**: Top usuarios por horas consumidas, items completados, etc.
- **Rankings por categoría**: Top Movies, Top TV, Top Games de la comunidad

### Out of Scope
- Búsqueda avanzada con boolean operators (AND, OR, NOT)
- Recomendaciones personalizadas basadas en ML
- Rankings semanales/mensuales (solo globales de siempre)
- Exportar rankings a CSV/PDF

## Approach

### Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      SearchBar Component                     │
│  - Unified input (TMDB + IGDB + Users)                     │
│  - Type filters (chips)                                     │
│  - Category filters (dropdown when type selected)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
   /api/search   /api/search   /api/search   /api/rankings
      /movies       /tv           /games        /global
                                                    │
                                                    ▼
                                           Rankings Cards
                                           - Top by time
                                           - Top by items
                                           - Top by category
```

### APIs Necesarias

#### GET /api/search?q={query}&type={type}&filters={json}

**Tipos de búsqueda:**
- `all`: Busca en todos los tipos
- `movie`: Solo películas
- `tv`: Solo series
- `game`: Solo videojuegos
- `user`: Solo usuarios de Lumen

**Filtros por tipo:**
```typescript
// Movies/TV
{ genres: string[], yearFrom: number, yearTo: number, minRating: number }

// Games
{ genres: string[], platforms: string[], yearFrom: number, minRating: number }

// Users
{ hasAvatar: boolean }
```

**Response:**
```typescript
{
  movies: MovieResult[],
  tv: TvResult[],
  games: GameResult[],
  users: UserResult[],
  totalResults: number
}
```

#### GET /api/rankings?type={type}&limit={n}

**Tipos de ranking:**
- `time`: Por horas totales consumidas
- `items`: Por cantidad de items completados
- `platinum`: Por juegos platinados (games)
- `movies`: Por películas vistas
- `tv`: Por episodios vistos
- `games`: Por juegos jugados

**Response:**
```typescript
{
  global: RankingEntry[],
  byCategory: {
    movies: RankingEntry[],
    tv: RankingEntry[],
    games: RankingEntry[]
  }
}

interface RankingEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  value: number; // hours, items count, etc.
  trend?: "up" | "down" | "same";
}
```

### UI Components

```
src/app/search/page.tsx                    # Página de búsqueda
src/app/rankings/page.tsx                  # Página de rankings
src/components/search/
├── SearchBar.tsx                          # Barra unificada
├── SearchFilters.tsx                      # Filtros avanzados
├── SearchResults.tsx                      # Grid de resultados
├── SearchHistory.tsx                      # Historial
├── TypeFilterChips.tsx                    # Chips: All, Movies, TV, Games, Users
├── MovieSearchCard.tsx
├── TvSearchCard.tsx
├── GameSearchCard.tsx
└── UserSearchCard.tsx
src/components/rankings/
├── RankingsPage.tsx
├── GlobalRanking.tsx
├── CategoryRanking.tsx
└── RankingCard.tsx
```

### Database Schema

```sql
-- Tabla para historial de búsquedas
CREATE TABLE public.user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL, -- 'movie', 'tv', 'game', 'user', 'all'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_search_history_user_id ON public.user_search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.user_search_history(created_at DESC);

-- RLS policies
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

-- Solo el usuario puede ver su propio historial
CREATE POLICY "Users can view own search history"
ON public.user_search_history FOR SELECT
USING (auth.uid() = user_id);

-- Cualquier usuario puede crear búsquedas
CREATE POLICY "Users can insert search history"
ON public.user_search_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Función para obtener top usuarios (para rankings)
CREATE OR REPLACE FUNCTION get_top_users_by_metric(
  metric TEXT, -- 'total_minutes', 'movies_watched', 'games_platinum', etc.
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY 
      CASE metric
        WHEN 'total_minutes' THEN gs.total_minutes
        WHEN 'movies_watched' THEN gs.total_movies_watched
        WHEN 'games_played' THEN gs.total_games_played
        WHEN 'games_platinum' THEN gs.total_games_platinum
        ELSE gs.total_minutes
      END DESC
    )::BIGINT as rank,
    u.id as user_id,
    u.username,
    u.avatar_url,
    (CASE metric
      WHEN 'total_minutes' THEN gs.total_minutes
      WHEN 'movies_watched' THEN gs.total_movies_watched
      WHEN 'games_played' THEN gs.total_games_played
      WHEN 'games_platinum' THEN gs.total_games_platinum
      ELSE gs.total_minutes
    END)::NUMERIC as value
  FROM public.users u
  JOIN public.user_global_stats gs ON u.id = gs.user_id
  WHERE u.is_public = true
  ORDER BY rank
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Navigation Integration

```
src/app/page.tsx
├── SearchBar (compact, expands on focus)
│   └── /search?q={query}
├── Navbar
│   ├── Home → /
│   ├── Rankings → /rankings (NEW)
│   ├── Search → /search (focus on load)
│   └── Profile → /profile/{username}
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/search/page.tsx` | New | Página principal de búsqueda |
| `src/app/rankings/page.tsx` | New | Página de rankings |
| `src/app/api/search/route.ts` | New | API unificada de búsqueda |
| `src/app/api/rankings/route.ts` | New | API de rankings |
| `src/components/search/` | New | Componentes de búsqueda |
| `src/components/rankings/` | New | Componentes de rankings |
| `public/icons/` | Modified | Agregar iconos de ranking |
| `supabase/migrations/028_search_rankings.sql` | New | Historial y funciones de ranking |
| `src/modules/shared/domain/` | Modified | Agregar tipos de búsqueda |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rate limiting de TMDB/IGDB | High | Cachear resultados por 1 hora |
| Búsqueda lenta con muchos resultados | Medium | Pagination + debounce |
| Rankings desbalanceados (usuarios sin actividad) | Low | Filtrar usuarios con < 1 hora de actividad |
| Nombres de usuario con caracteres especiales | Low | Sanitizar input con regex |

## Dependencies

- Supabase Auth
- TMDB API (películas/series)
- IGDB API (videojuegos)
- Tabla `user_global_stats` con métricas
- Existing `users` table con `is_public` flag

## Success Criteria

- [ ] Búsqueda unificada returns resultados de movies, tv, games y users
- [ ] Filtros por tipo funcionan correctamente
- [ ] Filtros avanzados (género, año, rating) funcionan
- [ ] Historial de búsquedas se guarda y muestra
- [ ] Rankings muestran top 10 usuarios por cada métrica
- [ ] Rankings son públicos (no requiere login)
- [ ] UI responsive en mobile
- [ ] Tiempo de respuesta < 500ms
- [ ] Tests E2E pasando

## Notes

### TMDB Search API
```bash
# Películas
GET https://api.themoviedb.org/3/search/movie?query={query}&api_key={key}

# Series
GET https://api.themoviedb.org/3/search/tv?query={query}&api_key={key}
```

### IGDB Search
```bash
# Juegos
POST https://api.igdb.com/v4/games
Body: search "{query}"; fields name, cover.url, first_release_date;
```

### User Search
```sql
-- Búsqueda de usuarios por username (case insensitive)
SELECT id, username, avatar_url 
FROM users 
WHERE LOWER(username) LIKE LOWER('%' || $1 || '%')
AND is_public = true
LIMIT 20;
```
