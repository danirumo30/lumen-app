# Proposal: 026 - TV Episode Tracking System

## Intent

Implementar un sistema completo de seguimiento de episodios de series de TV similar a TV Time, permitiendo a los usuarios marcar episodios individuales, marcar temporadas completas, y ver estadísticas de tiempo invertido en series.

## Scope

### In Scope
- **Marcado individual de episodios**: Toggle para marcar/desmarcar episodios específicos
- **Marcado por temporada**: Botón para marcar todos los episodios de una temporada
- **Marcado masivo (todos los episodios)**: Modal de confirmación para series grandes
- **Auto-activación de serie**: Al marcar un episodio, la serie se marca automáticamente como "en seguimiento"
- **Stats en tiempo real**: Minutos calculados automáticamente vía trigger de BD
- **UI optimista**: Actualización inmediata de la UI sin esperar respuesta del servidor
- **Paginación**: Soporte para series con 1000+ episodios

### Out of Scope
- Descarga offline de episodios
- Sincronización con otros servicios (Trakt, Letterboxd)
- Notificaciones de nuevos episodios
- Watchlist de episodios pendientes

## Approach

### Arquitectura General
```
[TV Detail Page] ──fetch──> [Episode Status API]
                        ├── GET episodes (paginated)
                        ├── POST mark episode
                        ├── POST mark season
                        └── POST mark all

[Supabase]
├── user_media_tracking (estado de serie)
├── user_episode_tracking (estado de episodios)
└── Trigger: update_tv_progress_trigger (stats)
```

### APIs Necesarias

#### GET /api/user/episode-status?tmdbId={id}&season={n}
Retorna el estado de todos los episodios de una temporada.

**Response:**
```typescript
{
  episodes: Array<{
    episodeNumber: number;
    watched: boolean;
    watchedAt: string | null;
  }>;
  totalEpisodes: number;
  watchedEpisodes: number;
}
```

#### POST /api/user/episode-status
Marca/desmarca episodios.

**Body:**
```typescript
{
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;        // Para marcado individual
  action: "mark" | "unmark";    // Solo para individual
}
```

#### POST /api/user/episode-status (bulk)
Marcado masivo.

**Body:**
```typescript
{
  tmdbId: number;
  seasonNumber?: number;         // Si es null = todos
  action: "mark" | "unmark";
}
```

### UI Components

```
src/app/tv/[id]/page.tsx         # Página de detalle TV
src/components/tv/
├── EpisodesAccordion.tsx       # Acordeón de temporadas
├── EpisodeItem.tsx             # Episode individual
├── SeasonActions.tsx          # Botones de temporada
└── MarkAllModal.tsx           # Modal de confirmación
```

### Database Schema

```sql
-- Tabla de tracking de episodios
CREATE TABLE user_episode_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, season_number, episode_number)
);

-- Trigger para actualizar stats de TV
CREATE OR REPLACE FUNCTION update_tv_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcula minutos basados en runtime de episodios
  UPDATE user_media_tracking
  SET progress_minutes = (
    SELECT COALESCE(SUM(COALESCE(e.runtime, 24) * 60), 0)
    FROM user_episode_tracking uet
    JOIN episode e ON e.season_number = uet.season_number 
                   AND e.episode_number = uet.episode_number
    WHERE uet.tmdb_id = NEW.tmdb_id AND uet.user_id = NEW.user_id
  )
  WHERE tmdb_id = NEW.tmdb_id AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tv_progress_trigger
AFTER INSERT OR DELETE ON user_episode_tracking
FOR EACH ROW EXECUTE FUNCTION update_tv_progress();
```

### Optimistic Updates

```typescript
// Ejemplo de actualización optimista
const mutation = useMutation({
  mutationFn: markEpisode,
  onMutate: async (newEpisode) => {
    // Cancelar queries activas
    await queryClient.cancelQueries(['episodes', tmdbId, season]);
    
    // Snapshot del estado anterior
    const previousEpisodes = queryClient.getQueryData(['episodes', tmdbId, season]);
    
    // Actualizar cache inmediatamente
    queryClient.setQueryData(['episodes', tmdbId, season], (old) => 
      updateEpisodeStatus(old, newEpisode)
    );
    
    return { previousEpisodes };
  },
  onError: (err, newEpisode, context) => {
    // Rollback en caso de error
    queryClient.setQueryData(['episodes', tmdbId, season], context.previousEpisodes);
  },
  onSettled: () => {
    // Invalidar para asegurar consistencia
    queryClient.invalidateQueries(['episodes', tmdbId]);
    queryClient.invalidateQueries(['tv-status', tmdbId]);
  }
});
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/user/episode-status/route.ts` | New | API de episodios con bulk support |
| `src/app/api/user/tv-status/route.ts` | Modified | Agregar invalidación de cache |
| `src/app/tv/[id]/page.tsx` | Modified | Agregar EpisodesAccordion |
| `src/components/tv/EpisodesAccordion.tsx` | New | Componente de episodios |
| `src/components/tv/EpisodeItem.tsx` | New | Episode individual |
| `src/components/tv/MarkAllModal.tsx` | New | Modal de confirmación |
| `src/modules/media/` | Modified | Agregar hooks de episodios |
| `supabase/migrations/011_tv_progress.sql` | New | Schema y triggers |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Series con 1000+ episodios | Medium | Paginación en API (100/pag) |
| Runtime null en episodios | Medium | Default 24 minutos |
| Trigger deshabilitado | Low | Verificar en setup |
| Race conditions en bulk | Medium | Transacciones atómicas |

## Dependencies

- TMDB API para episodios
- Supabase Auth
- React Query para caché
- Trigger de BD para stats

## Success Criteria

- [ ] Usuario puede marcar/desmarcar episodio individual
- [ ] Usuario puede marcar todos los episodios de una temporada
- [ ] Usuario puede marcar todos los episodios de la serie (con modal)
- [ ] Serie se auto-activa al marcar episodio
- [ ] Stats de minutos se actualizan en tiempo real
- [ ] UI actualiza óptimistamente sin delay percibido
- [ ] Funciona con series de 1000+ episodios
- [ ] Tests E2E pasando

## Lessons Learned

### Problemas técnicos resueltos:
1. **Supabase default limit 1000**: El cliente tiene límite por defecto de 1000 que no se puede exceder con `.limit()`. Solución: usar paginación con `.range(offset, offset + BATCH_SIZE - 1)`

2. **Trigger deshabilitado**: El trigger `update_tv_progress_trigger` estaba deshabilitado (`enabled: "D"`). Habilitado con: `ALTER TABLE user_media_tracking ENABLE TRIGGER update_tv_progress_trigger`

3. **Runtime default**: Episodios sin runtime ponían `progress_minutes: 0`. Solución: usar 24 minutos por defecto

4. **UI no actualizaba**: Faltaba invalidación de cache de `tv-status` después de marcar episodios. Agregado `queryClient.invalidateQueries({ queryKey: ["tv-status"] })`