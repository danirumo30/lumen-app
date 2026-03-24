# Feature: Search & Discover (Unified)

> Status: **Planned** | Proposal: [#28](../proposals/028-search-navigation-and-rankings.md)

## Overview

Una página unificada `/discover` que combina búsqueda activa y exploración pasiva. Los usuarios buscan cuando saben qué quieren, exploran cuando no.

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

### Phase 1: Core (Search)
- [ ] Unified Search API (`/api/search`)
- [ ] Discover page (`/discover`)
- [ ] Search bar con debounce
- [ ] Type chips selector

### Phase 2: Filters & UI
- [ ] Advanced filters (genre, year, platform)
- [ ] Filter UI components
- [ ] Card components por tipo
- [ ] Responsive grid

### Phase 3: Rankings
- [ ] Rankings API (`/api/rankings`)
- [ ] Rankings page (`/rankings`)
- [ ] Global + category rankings

### Phase 4: Extras
- [ ] Search history
- [ ] Discover mode (tendencias)

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
2. **Debounce 300ms**: Balance entre responsividad y rate limits
3. **Type-first**: Los filtros avanzandos aparecen según el tipo seleccionado
4. **Rankings separados**: `/rankings` para mantener `/discover` limpia

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