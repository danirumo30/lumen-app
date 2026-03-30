# Proposal 023: Homepage Trending Carousels

## Intent

Implementar una homepage profesional con 3 carruseles que muestren contenido trending de TMDB (películas/series) e IGDB (videojuegos). El diseño debe ser distintivo, aesthetic y seguir la guía de `frontend-design` skill.

## Scope

### Included
- Homepage (`/`) con 3 carruseles horizontales:
  1. **Trending Movies** - Películas populares de TMDB
  2. **Trending TV Shows** - Series populares de TMDB  
  3. **Trending Games** - Videojuegos populares de IGDB
- API Routes para consumir datos de TMDB e IGDB
- Diseño premium siguiendo `frontend-design` guidelines
- Responsive design para móvil/desktop
- Skeleton loading states
- Lazy loading de imágenes

### Excluded
- Detalle de media individual (será otra feature)
- Sistema de tracking/favoritos en homepage
- Rankings globales (futura feature)

## Approach

### Architecture
```
src/
├── app/
│   ├── page.tsx                    # Homepage actualizada
│   └── api/
│       └── trending/
│           ├── movies/route.ts     # TMDB trending movies
│           ├── tv/route.ts         # TMDB trending TV
│           └── games/route.ts      # IGDB games
├── modules/
│   └── media/
│       ├── infrastructure/
│       │   └── external/
│       │       ├── tmdb.repository.ts    # TMDB adapter
│       │       └── igdb.repository.ts    # IGDB adapter
│       └── application/
│           └── trending.service.ts # Trending use cases
```

### API Design

**GET /api/trending/movies**
```json
{
  "results": [
    {
      "id": "tmdb_123",
      "title": "Movie Title",
      "posterUrl": "https://image.tmdb.org/...",
      "voteAverage": 8.5,
      "releaseDate": "2024-01-15"
    }
  ]
}
```

**GET /api/trending/tv**
```json
{
  "results": [
    {
      "id": "tmdb_456",
      "title": "TV Show Title",
      "posterUrl": "https://image.tmdb.org/...",
      "voteAverage": 9.1,
      "firstAirDate": "2024-01-10"
    }
  ]
}
```

**GET /api/trending/games**
```json
{
  "results": [
    {
      "id": "igdb_789",
      "name": "Game Title",
      "coverUrl": "https://images.igdb.org/...",
      "rating": 92,
      "releaseDate": "2024-01-20"
    }
  ]
}
```

### External APIs

**TMDB API v3**
- Base URL: `https://api.themoviedb.org/3`
- Auth: `?api_key={TMDB_API_KEY}`
- Endpoints:
  - `/trending/movie/week` - Trending movies
  - `/trending/tv/week` - Trending TV shows

**IGDB API**
- Base URL: `https://api.igdb.com/v4`
- Auth: Bearer token (`IGDB_ACCESS_TOKEN`)
- Endpoints:
  - `/games` - Popular games
  - Fields: `id, name, cover.url, rating, first_release_date`

## Affected Areas

| Area | Impact |
|------|--------|
| `src/app/page.tsx` | Homepage principal |
| `src/app/api/trending/` | 3 nuevos API routes |
| `src/modules/media/` | Nuevos repositorios externos |
| `.env.local` | API keys ya configuradas |

## Risks

| Risk | Mitigation |
|------|------------|
| Rate limiting de APIs externas | Cache en server (1h) |
| Imágenes no disponibles | Fallback placeholder |
| API key expira | Warning en build |

## Success Criteria

- [ ] Homepage muestra 3 carruseles con datos reales
- [ ] Diseño sigue frontend-design guidelines (aesthetic, memorable)
- [ ] Responsive en móvil y desktop
- [ ] Loading skeletons mientras carga
- [ ] No errores en consola
- [ ] Tests de los API routes
- [ ] Feature document en `docs/features/`
