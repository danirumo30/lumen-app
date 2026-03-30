# Feature 010: Movie & TV Tracking System

## Overview

Sistema completo de seguimiento de películas y series de TV, permitiendo a los usuarios marcar contenido como visto, favorito, o pendiente, con estadísticas en tiempo real de tiempo invertido.

## Architecture

### Data Flow

```
[Frontend - Movie/TV Detail]
       │
       ├── GET /api/user/movie-status?tmdbId=123
       ├── GET /api/user/tv-status?tmdbId=123
       ├── GET /api/user/episode-status?tmdbId=123&season=1
       │
       ▼
[Supabase APIs]
       │
       ├── user_media_tracking (movies & TV series)
       ├── user_episode_tracking (TV episodes)
       │
       ▼
[Database Triggers]
       │
       └── update_tv_progress_trigger → stats calculados automáticamente
```

### File Structure

```
src/
├── app/
│   ├── movie/[id]/page.tsx              # Movie detail page
│   ├── tv/[id]/page.tsx                 # TV detail page with episodes
│   └── api/user/
│       ├── movie-status/route.ts        # GET/POST movie tracking
│       ├── movie-favorite/route.ts     # Favorite toggle
│       ├── tv-status/route.ts           # GET/POST TV tracking
│       ├── tv-favorite/route.ts        # Favorite toggle
│       └── episode-status/route.ts      # Episode tracking (bulk)
│
├── components/
│   ├── movie/
│   │   ├── MovieDetail.tsx              # Movie hero & info
│   │   ├── CastCarousel.tsx             # Cast/credits carousel
│   │   ├── SimilarMoviesCarousel.tsx   # Similar movies
│   │   └── WatchedButton.tsx            # Mark as watched
│   │
│   └── tv/
│       ├── TvDetail.tsx                  # TV hero & info
│       ├── EpisodesAccordion.tsx         # Season/episode accordion
│       ├── EpisodeItem.tsx               # Single episode
│       ├── MarkAllModal.tsx              # Bulk mark confirmation
│       └── SeasonActions.tsx             # Season mark buttons
│
└── modules/
    └── media/
        ├── domain/
        │   └── episode.types.ts          # TypeScript types
        │
        ├── infrastructure/
        │   ├── hooks/                    # React Query hooks
        │   ├── queries/                  # API queries
        │   └── queue/                    # Mutation queue (optional)
```

## API Design

### GET /api/user/movie-status?tmdbId={id}

Returns tracking status for a movie.

**Response:**
```typescript
{
  watched: boolean;
  watchedAt: string | null;  // ISO date
  favorite: boolean;
  status: "none" | "watched" | "favorite";
}
```

### POST /api/user/movie-status

Marks/unmarks a movie.

**Request:**
```typescript
{
  tmdbId: number;
  action: "watch" | "unwatch" | "favorite" | "unfavorite";
}
```

### GET /api/user/tv-status?tmdbId={id}

Returns tracking status for a TV series.

**Response:**
```typescript
{
  status: "none" | "watching" | "completed" | "dropped" | "pending";
  favorite: boolean;
  progressMinutes: number;     // Calculated via DB trigger
  totalEpisodes: number;      // From TMDB
  watchedEpisodes: number;   // Count from user_episode_tracking
  lastWatchedSeason: number;
  lastWatchedEpisode: number;
}
```

### POST /api/user/tv-status

Updates TV series status.

**Request:**
```typescript
{
  tmdbId: number;
  status: "none" | "watching" | "completed" | "dropped" | "pending";
  action: "setStatus" | "favorite" | "unfavorite";
}
```

### GET /api/user/episode-status?tmdbId={id}&season={n}

Returns episode tracking for a season.

**Response:**
```typescript
{
  seasonNumber: number;
  episodes: Array<{
    episodeNumber: number;
    watched: boolean;
    watchedAt: string | null;
  }>;
  totalEpisodes: number;
  watchedEpisodes: number;
}
```

### POST /api/user/episode-status

Marks/unmarks episodes (supports bulk).

**Request (single):**
```typescript
{
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
  action: "mark" | "unmark";
}
```

**Request (bulk):**
```typescript
{
  tmdbId: number;
  seasonNumber?: number;       // null = all seasons
  action: "mark" | "unmark";
}
```

## Database Schema

### user_media_tracking

```sql
CREATE TABLE user_media_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,           -- 'movie' or 'tv'
  status TEXT DEFAULT 'none',         -- 'none', 'watching', 'completed', 'dropped', 'pending'
  is_favorite BOOLEAN DEFAULT false,
  progress_minutes INTEGER DEFAULT 0, -- Auto-calculated via trigger
  watched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id)
);
```

### user_episode_tracking

```sql
CREATE TABLE user_episode_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tmdb_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, season_number, episode_number)
);
```

### Trigger for real-time stats

```sql
CREATE OR REPLACE FUNCTION update_tv_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_media_tracking
  SET progress_minutes = (
    SELECT COALESCE(SUM(COALESCE(e.runtime, 24) * 60), 0)
    FROM user_episode_tracking uet
    WHERE uet.tmdb_id = NEW.tmdb_id AND uet.user_id = NEW.user_id
  ),
  updated_at = NOW()
  WHERE tmdb_id = NEW.tmdb_id AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tv_progress_trigger
AFTER INSERT OR DELETE ON user_episode_tracking
FOR EACH ROW EXECUTE FUNCTION update_tv_progress();
```

**Nota**: El trigger debe estar habilitado. Verificar con:
```sql
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'update_tv_progress_trigger';
-- Si está deshabilitado (D), habilitar:
-- ALTER TABLE user_media_tracking ENABLE TRIGGER update_tv_progress_trigger;
```

## Design Decisions

### Why Optimistic Updates?
- **UX**: La UI responde instantáneamente, sin esperar round-trip al servidor
- **Perceived performance**: 0ms de latencia percibida
- **Error handling**: Rollback automático si falla la mutation

### Why Database Triggers for Stats?
- **Consistency**: Stats siempre sincronizados con datos reales
- **Performance**: Cálculo en BD, no en frontend
- **Reliability**: No depende de código cliente

### Why Pagination for Episodes?
- **TMDB limit**: Episodes endpoint tiene límites
- **Supabase limit**: Default 1000 rows, excedible con `.range()`
- **User experience**: Cargar primera página rápido, más bajo demanda

### Why 24 minutes default for episodes?
- Industry standard para episodios de TV (sin datos de runtime)
- Ajustable si TMDB tiene datos reales

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-side) |
| `TMDB_API_KEY` | TMDB API key |

## Features

### Movie Tracking
- [x] Mark/unmark as watched
- [x] Mark/unmark as favorite
- [x] View watch date
- [x] Cast carousel
- [x] Similar movies carousel

### TV Tracking
- [x] Mark/unmark episodes individually
- [x] Mark all episodes in season
- [x] Mark all episodes (with confirmation modal)
- [x] Auto-activate series when marking episodes
- [x] Real-time stats (minutes calculated via trigger)
- [x] Episode accordion with season grouping
- [x] Optimistic updates for instant UI feedback
- [x] Pagination for large series (1000+ episodes)

### Profile Stats
- [x] Total minutes watched (movies + TV)
- [x] Movies count
- [x] TV series count
- [x] Episodes watched count
- [x] Auto-refresh on any tracking change

## Testing

### E2E Tests
```bash
pnpm test:e2e
```

Tests covered:
- Movie watch/unwatch toggle
- TV status change
- Episode individual mark
- Episode bulk mark (season)
- Auto-activation on episode mark
- Profile stats update

## Related Proposals

- [Proposal 025: Movie Detail Page](../proposals/025-movie-detail-page.md)
- [Proposal 026: TV Episode Tracking System](../proposals/026-tv-episode-tracking.md)

## Future Enhancements

- [ ] Add "continue watching" section
- [ ] Episode watch history timeline
- [ ] Bulk import from Trakt/Letterboxd
- [ ] Push notifications for new episodes
- [ ] Offline mode with sync
- [ ] Share watch history
- [ ] Watch parties