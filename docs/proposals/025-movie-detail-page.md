# Proposal: 025 - Movie Detail Page

## Intent

Crear una página de detalles de película similar a TV Time, mostrando información completa de la película con carousel de reparto, películas similares, datos de usuario y opción para marcar como vista.

## Scope

### In Scope
- **Ruta**: `/movie/[id]/about` o similar
- **Información de la película**:
  - Título, poster, fecha de lanzamiento
  - Géneros
  - Rating de TMDB
  - Sinopsis
- **Datos de usuario**:
  - Si el usuario la tiene marcada como vista
  - Fecha en que la vio
- **Carousel de reparto** (cast) de TMDB
- **Carousel de películas similares** de TMDB
- **Botón marcar como vista** con feedback visual

### Out of Scope
- Episodios de series (futura feature)
- Trailer/play inline
- Reviews de usuarios
- Sharing social

## Approach

### Estructura
```
/src/app/movie/[tmdbId]/page.tsx
/src/components/movie/
  MovieDetail.tsx
  MovieInfo.tsx
  CastCarousel.tsx
  SimilarMoviesCarousel.tsx
  WatchedButton.tsx
```

### API Endpoints necesarios
- GET `/api/movie/[id]` - Datos de película de TMDB
- GET `/api/movie/[id]/credits` - Reparto de TMDB
- GET `/api/movie/[id]/similar` - Películas similares de TMDB
- POST/PUT `/api/user/movie-status` - Marcar como vista

### UI Layout (estilo TV Time)
```
┌─────────────────────────────────────┐
│  Poster      │  Título              │
│  (grande)    │  Fecha lanzamiento   │
│              │  Géneros | Rating     │
│              │  Sinopsis            │
│              │  [Marcar como vista] │
├─────────────────────────────────────┤
│  Tu progreso                        │
│  ✓ Vista el 15/01/2024             │
├─────────────────────────────────────┤
│  Reparto ──────────────────────→    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │    │ │    │ │    │ │    │     │
│  │Actor│ │Actor│ │Actor│ │Actor│    │
│  │Rol │ │Rol │ │Rol │ │Rol │     │
│  └────┘ └────┘ └────┘ └────┘     │
├─────────────────────────────────────┤
│  Películas similares ───────────→    │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │    │ │    │ │    │ │    │     │
│  └────┘ └────┘ └────┘ └────┘     │
└─────────────────────────────────────┘
```

### Diseño
- Dark theme premium (zinc-950 como fondo)
- Glassmorphism en cards y badges
- Tracking más tight en títulos
- Drag scroll igual que homepage/profile
- Scrollbar violeta con hover

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/movie/[id]/page.tsx` | New | Ruta de detalles |
| `src/app/api/movie/[id]/route.ts` | New | API TMDB movie details |
| `src/app/api/movie/[id]/credits/route.ts` | New | API TMDB credits |
| `src/app/api/movie/[id]/similar/route.ts` | New | API TMDB similar |
| `src/components/movie/` | New | Componentes de detalle |
| `src/components/home/useDragScroll.ts` | Existing | Reutilizar para carousels |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TMDB API rate limits | Low | Cachear respuestas |
| Usuario no logueado | Medium | Mostrar botón "Iniciar sesión" |
| Sin datos de usuario en DB | Medium | Crear entrada al marcar |

## Dependencies

- TMDB API key configurado
- Supabase Auth para usuario logueado
- Reutilizar `useDragScroll` del homepage

## Success Criteria

- [ ] Página accesible en `/movie/[tmdbId]`
- [ ] Muestra poster, título, fecha, rating, géneros, sinopsis
- [ ] Carousel de reparto funcional con drag scroll
- [ ] Carousel de similares funcional con drag scroll
- [ ] Botón "Marcar como vista" funciona (crea/actualiza en Supabase)
- [ ] Muestra fecha vista si el usuario ya la tiene marcada
- [ ] Diseño premium dark theme consistente con el resto
