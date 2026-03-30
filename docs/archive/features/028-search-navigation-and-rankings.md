# Feature: Search & Discover (Unified)

> Status: **Implemented** | Proposal: [#28](../proposals/028-search-navigation-and-rankings.md)

## Overview

Una página unificada `/discover` que combina búsqueda activa y exploración pasiva. Los usuarios buscan cuando saben qué quieren, exploran cuando no.

## Implementation Summary

La feature está completamente implementada y probada. Incluye:

- API unificada `/api/search` para búsqueda con filtros (películas, series, juegos, usuarios)
- Página `/discover` con barra de búsqueda, chips de tipo y filtros avanzados (género, año, plataforma, orden)
- Grid responsive con cards específicas por tipo
- Soporte de paginación infinita
- Ordenamiento bidireccional (asc/desc) con ícono rotatorio
- Tratamiento diferenciado de búsqueda vs. descubrimiento:
  - **TMDB search** no soporta filtros de género/plataforma → se deshabilitan durante búsqueda
  - **IGDB search** sí soporta combinación de búsqueda + filtros (género, plataforma, año, rating)
  - **Ordenamiento en búsqueda**: Películas/Series usan `vote_count`; Juegos tienen orden deshabilitado (limitación IGDB)
  - Año en búsqueda (películas/series): dropdown simple (único año)
- Fallback de ordenamiento en cliente para películas/series cuando TMDB ignora `sort_by`
- Corrección de bugs: filtros aplicados correctamente con búsqueda, sorting funcional, detección de providers duplicados

## Design

### Aesthetic
- Dark refined minimal (noir cinema)
- Glassmorphism sutil en cards
- Acentos por tipo: amber=movies, cyan=tv, violet=games, emerald=users

### Color Palette
```css
--bg-primary: #09090b;
--color-movie: #f59e0b;
--color-tv: #06b6d4;
--color-game: #8b5cf6;
--color-user: #10b981;
```

### Layout
```
[Search Bar] → Modo Search (con typing)
     ↓
[Type Chips] → Todo | Movies | TV | Games | Users
     ↓
[Filters] → Género, Año, Plataforma, Ordenar
     ↓
[Grid] → Resultados o Tendencias (Discover)
```

## Implementation Progress

### ✅ Phase 1: Core (Search)
- [x] Unified Search API (`/api/search`)
- [x] Discover page (`/discover`)
- [x] Search bar con debounce unificado en Grid
- [x] Type chips selector
- [x] Paginación infinita

### ✅ Phase 2: Filters & UI
- [x] Advanced filters (genre, year, platform, sort)
- [x] Filter UI components (dropdowns deshabilitados según contexto)
- [x] Card components por tipo (Movie, TV, Game, User)
- [x] Responsive grid

### ⚠️ Phase 3: Rankings (Pending)
- [ ] Rankings API (`/api/rankings`)
- [ ] Rankings page (`/rankings`)
- [ ] Global + category rankings

### 🔄 Phase 4: Extras (Partial)
- [x] Client-side fallback sorting for TMDB search
- [ ] Search history (pendiente)
- [x] Discover mode (tendencias) via `/api/discover`

## Architecture

```
┌─────────────────────────────────────────────┐
│           /discover Page                    │
│  ┌─────────────────────────────────────────┐ │
│  │ SearchBar (expands on focus)            │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ TypeChips: All | Movies | TV | Games    │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ Filters (genre, year, platform, sort)   │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ Results Grid / Trending Grid            │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Key Decisions

1. **Unified page**: Search + Explore en `/discover` para simplificar UX
2. **Debounce 150ms en Grid**: Unifica debounce de búsqueda y filtros
3. **Type-first**: Los filtros avanzados aparecen según el tipo seleccionado
4. **Rankings separados**: `/rankings` para mantener `/discover` limpia
5. **Client-side fallback sorting**: Garantiza orden en películas/series cuando TMDB ignora `sort_by` en búsqueda
6. **IGDB genre filter**: Usa IDs numéricos (no nombres) para géneros en búsqueda de juegos

## Known Limitations

- **TMDB Search API** no soporta filtros de género/plataforma/año (rango). Durante búsqueda, estos controles se deshabilitan en películas/series.
- **IGDB Search** no permite `sort` junto con `search`. Ordenamiento en juegos está deshabilitado durante búsqueda.
- **Año en búsqueda** para películas/series: solo se puede filtrar por un año exacto (simple), no rangos.
- **Filters persistence**: Al cambiar pestaña, los filtros se mantienen (diseñado para UX fluida).

## Files Structure

```
src/app/discover/page.tsx           # Main page
src/app/rankings/page.tsx           # Rankings
src/app/api/search/route.ts         # Search API (unified)
src/app/api/discover/route.ts       # Trending API
supabase/migrations/028_*.sql       # History + rankings function (ya aplicado)
```

## Database

- `user_search_history` table (pendiente uso)
- `get_top_users_by_metric()` function (pendiente)

## Files Structure

```
src/app/discover/page.tsx           # Main page
src/app/rankings/page.tsx           # Rankings
src/app/api/search/route.ts         # Search API
src/app/api/discover/route.ts       # Trending API
src/app/api/rankings/route.ts       # Rankings API
src/components/discover/
├── DiscoverSearchBar.tsx
├── DiscoverTypeChips.tsx
├── DiscoverFilters.tsx
├── DiscoverGrid.tsx
├── DiscoverCard.tsx
├── MovieDiscoverCard.tsx
├── TvDiscoverCard.tsx
├── GameDiscoverCard.tsx
└── UserDiscoverCard.tsx
src/components/rankings/
├── RankingsPage.tsx
├── GlobalRanking.tsx
└── RankingCard.tsx
supabase/migrations/028_*.sql       # History + rankings function
```

## Database

- `user_search_history` table
- `get_top_users_by_metric()` function