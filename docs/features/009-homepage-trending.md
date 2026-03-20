# Feature 009: Homepage Trending Carousels

## Overview

Implementa una homepage profesional con 3 carruseles horizontales que muestran contenido trending de APIs externas (TMDB para películas/series, IGDB para videojuegos).

## Architecture

### Data Flow

```
[TMDB API] ──fetch──> [/api/trending/movies] ──map──> [Carousel Component]
[TMDB API] ──fetch──> [/api/trending/tv]     ──map──> [Carousel Component]
[IGDB API] ──fetch──> [/api/trending/games]  ──map──> [Carousel Component]
```

### File Structure

```
src/
├── app/
│   ├── page.tsx                    # Main page (server component with Suspense)
│   ├── home-content.tsx            # Client component with data fetching
│   └── api/trending/
│       ├── movies/route.ts         # TMDB trending movies
│       ├── tv/route.ts            # TMDB trending TV shows
│       └── games/route.ts         # IGDB games
└── components/home/
    ├── Carousel.tsx               # Reusable carousel component
    └── CarouselSkeleton.tsx       # Loading skeleton
```

## API Design

### GET /api/trending/movies
Returns trending movies from TMDB.

**Response:**
```typescript
{
  results: Array<{
    id: string;           // "tmdb_123"
    title: string;
    posterUrl: string | null;
    voteAverage: number;
    releaseDate: string;
    overview: string;
  }>
}
```

### GET /api/trending/tv
Returns trending TV shows from TMDB.

**Response:** Same structure as movies.

### GET /api/trending/games
Returns popular games from IGDB.

**Response:**
```typescript
{
  results: Array<{
    id: string;           // "igdb_789"
    name: string;
    coverUrl: string | null;
    rating: number | null;
    releaseDate: string;
    summary: string;
  }>
}
```

## Design Decisions

### Why Carousels?
- Industry standard pattern (Netflix, Disney+, HBO Max)
- Efficient way to showcase large content libraries
- Mobile-friendly horizontal scroll

### Why Edge Runtime?
- Reduces latency for API calls
- Better cold start performance
- Cache at the edge

### Why Cache 1 Hour?
- TMDB/IGDB data doesn't change frequently
- Avoids rate limiting
- Balance between freshness and performance

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TMDB_API_KEY` | TMDB API key for movie/TV data |
| `IGDB_ACCESS_TOKEN` | IGDB OAuth access token |
| `IGDB_CLIENT_ID` | IGDB Client ID (optional, for token refresh) |
| `IGDB_CLIENT_SECRET` | IGDB Client Secret (optional, for token refresh) |

## Future Enhancements

- [ ] Add "Add to List" button on hover
- [ ] Lazy load images with blur placeholder
- [ ] Infinite scroll pagination
- [ ] User-specific recommendations based on tracking history
- [ ] Search within trending results

## Related Proposals

- [Proposal 023: Homepage Trending Carousels](../proposals/023-homepage-trending-carousels.md)
