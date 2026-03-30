# Proposal: 027 - Video Games Functionality

## Intent

Extender la plataforma Lumen para soportar el tracking de videojuegos de forma completa, siguiendo el mismo patrón establecido para movies y TV. Los usuarios podrán buscar, marcar y hacer seguimiento de videojuegos usando la API de IGDB, con tracking de horas jugadas y achievement system.

## Scope

### In Scope
- **Búsqueda de videojuegos**: Integración con IGDB API para búsqueda y trending
- **Detalle de juego**: Página de detalle similar a movie/[id] y tv/[id]
- **Sistema de estados**: Marcar como Favorito, Jugando, Completado, Abandonado, Pendiente
- **Tracking de tiempo**: Registrar horas jugadas con actualización en tiempo real
- **Trending games**: Carousel de juegos populares en homepage
- **Perfil de usuario**: Secciones de juegos favoritos y completados

### Out of Scope
- Screenshots o galería de medios
- Reviews o ratings de usuarios
- Lista de logros/achievements del usuario
- Multiplayer o features sociales de gaming
- Integración con plataformas de gaming (Steam, PlayStation, Xbox)

## Approach

### Arquitectura General
```
[Game Detail Page] ──fetch──> [Game Status API]
                        ├── GET game info (IGDB)
                        ├── GET user game status
                        ├── POST update status
                        └── POST update playtime

[Supabase]
├── user_media_tracking (estado de juego + horas)
└── Trigger: update_game_progress_trigger
```

### APIs Necesarias

#### GET /api/games/[id]
Obtiene información del juego desde IGDB con datos cacheados.

**Response:**
```typescript
{
  id: string;           // "igdb_{id}"
  name: string;
  coverUrl: string;
  summary: string;
  genres: string[];
  platforms: string[];
  releaseDate: string;
  rating: number | null;
  involvedCompanies: string[];
}
```

#### GET /api/user/game-status?igdbId={id}
Retorna el estado de tracking del usuario.

**Response:**
```typescript
{
  status: "favorite" | "playing" | "completed" | "dropped" | null;
  playtimeMinutes: number;
  startedAt: string | null;
  completedAt: string | null;
}
```

#### POST /api/user/game-status
Actualiza estado y tiempo de juego.

**Body:**
```typescript
{
  igdbId: number;
  status: "favorite" | "playing" | "completed" | "dropped" | "remove";
  playtimeMinutes?: number;  // Minutos a agregar
}
```

### UI Components

```
src/app/games/[id]/page.tsx         # Página de detalle
src/components/games/
├── GameCard.tsx                    # Card para grids
├── GameStatusSelector.tsx          # Selector de estado
├── PlaytimeTracker.tsx            # Input de horas
├── GameStats.tsx                  # Stats del juego
└── IGDBGameSearch.tsx             # Búsqueda en homepage
```

### Database Schema

```sql
-- Trigger para actualizar stats de games
CREATE OR REPLACE FUNCTION update_game_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE user_stats
    SET total_game_minutes = (
      SELECT COALESCE(SUM(playtime_minutes), 0)
      FROM user_media_tracking
      WHERE user_id = NEW.user_id AND media_type = 'game'
    ),
    total_minutes = (
      SELECT COALESCE(SUM(progress_minutes), 0)
      FROM user_media_tracking
      WHERE user_id = NEW.user_id
    )
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE user_stats
    SET total_game_minutes = (
      SELECT COALESCE(SUM(playtime_minutes), 0)
      FROM user_media_tracking
      WHERE user_id = OLD.user_id AND media_type = 'game'
    ),
    total_minutes = (
      SELECT COALESCE(SUM(progress_minutes), 0)
      FROM user_media_tracking
      WHERE user_id = OLD.user_id
    )
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_media_tracking
FOR EACH ROW EXECUTE FUNCTION update_game_stats()
WHEN (NEW.media_type = 'game' OR OLD.media_type = 'game');
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/games/[id]/page.tsx` | New | Página de detalle de juego |
| `src/app/api/games/[id]/route.ts` | New | API de metadata de juego |
| `src/app/api/user/game-status/route.ts` | New | API de tracking de estado |
| `src/app/api/trending/games/route.ts` | Modified | Expandir funcionalidad |
| `src/components/games/GameCard.tsx` | New | Card para lists |
| `src/components/games/GameStatusSelector.tsx` | New | Selector de estado |
| `src/components/games/PlaytimeTracker.tsx` | New | Input horas jugadas |
| `src/components/home/TrendingGamesCarousel.tsx` | New | Carousel en homepage |
| `src/modules/media/` | Modified | Agregar hooks de games |
| `src/modules/social/ui/hooks/use-profile.ts` | Modified | Incluir games en stats |
| `supabase/migrations/027_games_support.sql` | New | Schema, cache y triggers |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rate limiting de IGDB API | Medium | Cachear metadata en BD por 24h |
| Datos incompletos de IGDB | Medium | Fallback a datos públicos |
| Migración de stats existentes | Low | Verificar trigger existente |
| Conflictos con IGDB IDs | Low | Usar prefijo igdb_ consistentemente |

## Dependencies

- IGDB API (Client ID + Access Token)
- Supabase Auth
- React Query para caché
- Trigger de BD para stats
- Existing `total_game_minutes` en user_stats

## Success Criteria

- [ ] Usuario puede buscar y ver detalle de videojuegos
- [ ] Usuario puede marcar juego como Favorito/Jugando/Completado/Abandonado
- [ ] Usuario puede registrar horas jugadas
- [ ] Stats de minutos se actualizan en tiempo real
- [ ] Trending games visible en homepage
- [ ] Perfil muestra juegos favoritos y completados
- [ ] UI actualiza óptimistamente sin delay percibido
- [ ] Tests E2E pasando

## Notes

### IGDB API Setup
- Client ID y Access Token ya configurados en `.env.local`
- Endpoint `/api/trending/games` ya funcional

### Existing Infrastructure
- `user_media_tracking` ya soporta `media_type = 'game'`
- `user_stats.total_game_minutes` ya existe
- El challenge es construir la UI y APIs faltantes
