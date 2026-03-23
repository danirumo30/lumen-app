# Feature: Search, Navigation & Rankings

> Status: **Planned** | Proposal: [#28](../proposals/028-search-navigation-and-rankings.md)

## Overview

This feature implements a unified search system across movies, TV shows, games, and users, plus global and category-based rankings to gamify the platform.

## Implementation Progress

### Planned
- [ ] Unified Search API (`/api/search`)
- [ ] Search page (`/search`)
- [ ] Search filters (type, genre, year, rating)
- [ ] Search history persistence
- [ ] Rankings API (`/api/rankings`)
- [ ] Rankings page (`/rankings`)
- [ ] Global rankings (top users by time/items)
- [ ] Category-specific rankings

## Architecture

```
Search Flow:
┌──────────────┐     ┌──────────────┐
│ SearchBar    │────▶│ /api/search  │
│ (debounced)  │     │              │
└──────────────┘     └──────┬───────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   ┌──────────┐       ┌──────────┐       ┌──────────┐
   │   TMDB   │       │   IGDB   │       │ Supabase │
   │ (movies/ │       │  (games) │       │ (users)  │
   │    tv)   │       │          │       │          │
   └──────────┘       └──────────┘       └──────────┘

Rankings Flow:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ RankingsPage │────▶│ /api/rankings│────▶│ user_global  │
│              │     │              │     │ _stats view  │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Key Decisions

### Why unified search?
- Single entry point for users
- Easier to maintain and extend
- Consistent UX across content types

### Why Supabase functions for rankings?
- Avoid exposing raw stats queries to client
- Single source of truth for ranking logic
- Easy to add caching layer later

## Files to Create/Modify

### New Files
- `src/app/search/page.tsx`
- `src/app/rankings/page.tsx`
- `src/app/api/search/route.ts`
- `src/app/api/rankings/route.ts`
- `src/components/search/*.tsx`
- `src/components/rankings/*.tsx`
- `supabase/migrations/028_search_rankings.sql`

### Modified Files
- `src/app/page.tsx` (add Rankings nav link)
- `src/components/layout/Navbar.tsx` (add Rankings)

## Database Changes

```sql
-- user_search_history table
-- Ranking functions (get_top_users_by_metric)
```

## Testing Strategy

1. Unit tests for search debouncing
2. Unit tests for ranking calculations
3. Integration tests for search API
4. E2E tests for full search flow
5. Performance tests for rankings

## Open Questions

- Should search results be cached? For how long?
- Do we need "popular searches" suggestions?
- Should rankings be filterable by time period?
