# Architecture Analysis - Current State (commit 957959f)

**Date:** 2026-03-29  
**Base:** `957959f refactor: complete Fase 1 code quality overhaul`

---

## 1. Bounded Contexts Overview

| Context | Purpose | Current Module |
|---------|---------|----------------|
| Auth | User authentication, sessions, verification, password reset | `src/modules/auth/` |
| Media | Content discovery, tracking, trending, details (TV, Movies, Games, Episodes) | `src/modules/media/` |
| Social | User profiles, followers, stats | `src/modules/social/` |
| Shared | Common types, utilities, errors | `src/modules/shared/` |

---

## 2. Domain Layer Analysis

### Auth Domain (`src/modules/auth/domain/`)

**Files:**
- `user.entity.ts` – User entity
- `auth.repository.ts` – Repository interface for user persistence

**Observations:**
- Only 2 files in domain layer. Missing:
  - Value objects: `Email`, `Username`, `FullName`, `Password`
  - Events: `UserRegistered`, `UserVerified`, `EmailConfirmed`
  - Separate `UserProfile` entity (currently likely mixed)
  - `UserMediaTracking` as part of User aggregate

**Violations:**
- Entity is probably anemic (logic in services, not in entity)
- No clear aggregate root definition

### Media Domain (`src/modules/media/domain/`)

**Files:**
- `media.entity.ts` (or similar) – Need to verify
- `user-media-state.entity.ts` – Tracking state for a user + media
- Repository interfaces: `tv-repository.port.ts`, `movie-repository.port.ts`, `game-repository.port.ts`, `episode-repository.port.ts` (one per table – anti-pattern)

**Observations:**
- Likely one repository per entity/table → violates "one repository per aggregate"
- No clear aggregate boundary. Should be a single `Media` aggregate containing Tv, Movie, Game, Episode.
- Missing value objects: `MediaId`, `TrackingStatus`, `MediaType`
- Missing domain events: `MediaToggled`, `MediaDiscovered`

### Social Domain (`src/modules/social/domain/`)

**Files:**
- `user-profile.entity.ts` – Social profile
- `user-profile.repository.ts` – Repository interface

**Observations:**
- Could be part of User aggregate? Decision: SEPARATE AGGREGATE (different context)
- Relationship: references User by ID (correct)
- Missing events: `ProfileUpdated`, `FollowAdded`, `FollowRemoved`

### Shared Domain (`src/modules/shared/domain/`)

**Files:**
- `errors/` – Domain error definitions
- `media.ts` – Value objects for media tracking (maybe)
- `models/` – DTOs?

**Observations:**
- Good place for VO base classes

---

## 3. Application Layer Analysis

**Location:** `src/modules/*/application/`

**Structure:**
- `use-cases/` – Command handlers (e.g., `register.use-case.ts`, `toggle-tv-status.use-case.ts`)
- `ports/` – Interfaces for external services (email, jwt, tmdb, igdb)

**Observations:**
- Use cases exist but are probably anemic (just orchestrating repos)
- Need to ensure they become proper application services (thin orchestration only)
- Commands and queries mixed; need to separate commands (write) from queries (read) optionally

---

## 4. Infrastructure Layer Analysis

**Locations:**
- `src/modules/*/infrastructure/repositories/` – Supabase implementations
- `src/modules/auth/infrastructure/email/` – Nodemailer service
- `src/modules/media/infrastructure/clients/` – TMDB and IGDB HTTP clients
- `src/middleware/` – Auth, rate limiting
- `src/lib/` – Utilities (supabase client, translate, platforms, api-response, errors)

**Violations:**
- Domain layer may import from infrastructure? Need to check
- `src/lib/` is a dumping ground: should be moved to `infrastructure/` (services, mappers, http)
- Hooks in `src/modules/social/infrastructure/hooks/` – Hooks are UI layer, not infrastructure. Should be under `infrastructure/http/hooks/` or `application/social/hooks/`

---

## 5. API Routes Analysis

**Routes** (`src/app/api/`): 32 endpoints

| Route | Method | Purpose | Quality |
|-------|--------|---------|---------|
| `/api/auth/register` | POST | Register user | OK |
| `/api/auth/confirm-email` | GET/POST? | Verify email | Check |
| `/api/auth/request-verification` | POST | Send verification email | OK |
| `/api/auth/request-password-reset` | POST | Request reset | OK |
| `/api/auth/reset-password` | POST | Reset password | OK |
| `/api/auth/login` | POST | Login (maybe new) | Check |
| `/api/auth/logout` | POST | Logout | Check |
| `/api/discover` | GET | Discover media (search + trending) | OK |
| `/api/trending/{movies,tv,games,users}` | GET | Trending | OK |
| `/api/search` | GET | Global search | OK |
| `/api/tv/[id]` | GET | TV details | OK |
| `/api/tv/[id]/season/[season]` | GET | Season episodes | OK |
| `/api/tv/[id]/similar` | GET | Similar shows | OK |
| `/api/movie/[id]` | GET | Movie details | OK |
| `/api/movie/[id]/credits` | GET | Cast/crew | OK |
| `/api/movie/[id]/similar` | GET | Similar movies | OK |
| `/api/games/[id]` | GET | Game details | OK |
| `/api/games/[id]/dlcs` | GET | DLCs | OK |
| `/api/games/[id]/franchise` | GET | Franchise info | OK |
| `/api/games/[id]/franchise-details` | GET | Franchise details | OK |
| `/api/games/[id]/media` | GET | Media (screenshots, videos) | OK |
| `/api/games/[id]/similar` | GET | Similar games | OK |
| `/api/games/[id]/videos` | GET | Trailers/gameplay | OK |
| `/api/user/tv-status` | POST | Toggle TV tracking | OK |
| `/api/user/movie-status` | POST | Toggle movie tracking | OK |
| `/api/user/game-status` | POST | Toggle game tracking | OK |
| `/api/user/episode-status` | POST | Toggle episode tracking | OK |
| `/api/user/tv-favorite` | POST | Toggle TV favorite (duplicate of status?) | Check |
| `/api/user/movie-favorite` | POST | Toggle movie favorite | Check |
| `/api/user/episode-favorite` | ?是否存在 | Check |
| `/api/profile/[username]` | GET | User profile page | OK |
| `/api/profile/edit` | POST | Update profile | OK |
| `/api/profile/[username]/stats` | GET | User stats | OK |
| `/api/watch-providers` | GET | Streaming providers | OK |

**Issues:**
- Some endpoints duplicate functionality (status vs favorite). Should unify.
- Non-RESTful: POST to `/user/tv-status` (action verb). Should be `POST /users/{id}/media/tracking` with body `{ mediaId, type, status }`
- Need pagination for user tracking list (if exists)
- Need versioning (`/api/v1/`)

---

## 6. Dependency Violations Check

Run:
```bash
grep -r "supabase" src/modules/auth/domain/
grep -r "next/server" src/modules/*/domain/
```

Expected: none. If found, need to fix.

---

## 7. Migration Plan Summary

### Files to Move (high-level)

| Source | Destination | Reason |
|--------|-------------|--------|
| `src/modules/auth/domain/*.ts` | `src/domain/auth/{entities,value_objects,events,repository,services/}` | Domain layer canonical structure |
| `src/modules/media/domain/*.ts` | `src/domain/media/...` | Same |
| `src/modules/social/domain/*.ts` | `src/domain/social/...` | Same |
| `src/modules/shared/domain/*` | `src/domain/shared/` | Same |
| `src/modules/auth/application/use-cases/*.ts` | `src/application/auth/commands/` | Application layer |
| `src/modules/auth/application/ports/*` | `src/application/auth/ports/` | Ports |
| `src/modules/media/application/use-cases/*` | `src/application/media/commands/` | Same |
| `src/modules/media/application/ports/*` | `src/application/media/ports/` | Same |
| `src/modules/social/application/use-cases/*` | `src/application/social/commands/` | Same |
| `src/modules/auth/infrastructure/repositories/*` | `src/infrastructure/persistence/supabase/auth/` | Infrastructure |
| `src/modules/media/infrastructure/repositories/*` | `src/infrastructure/persistence/supabase/media/` | Same |
| `src/modules/social/infrastructure/repositories/*` | `src/infrastructure/persistence/supabase/social/` | Same |
| `src/modules/auth/infrastructure/email/*` | `src/infrastructure/services/email/` | External service adapter |
| `src/modules/media/infrastructure/clients/*` | `src/infrastructure/external/tmdb/` y `igdb/` | External API adapters |
| `src/middleware/*` | `src/infrastructure/http/middleware/` | HTTP middleware |
| `src/modules/social/infrastructure/hooks/*` | `src/infrastructure/http/hooks/` | UI layer (still infrastructure/http) |
| `src/lib/api-response.ts` | `src/infrastructure/http/api-response.ts` | HTTP concern |
| `src/lib/errors/*` | `src/domain/shared/errors/` (domain) y `src/infrastructure/http/errors/` (mapper) | Split domain vs http |
| `src/lib/supabase.ts` | `src/infrastructure/persistence/supabase/client.ts` | Persistence client |
| `src/lib/translate.ts` | `src/infrastructure/services/translation/translation.service.ts` | External service |
| `src/lib/platforms.ts` | `src/infrastructure/mappers/platform.mapper.ts` | Mapper |

---

## 8. Implementation Order Rationale

1. **Batch 0** – Analysis (this doc) → Understand boundaries
2. **Batch 1** – Domain Layer → Establecer core puro
3. **Batch 2** – Application Layer → Casos de uso
4. **Batch 3** – Infrastructure Layer → Adaptadores
5. **Batch 4** – Utilities & Hooks → Limpiar lib/
6. **Batch 5** – Domain Enrichment → VO,.Entity behavior
7. **Batch 6** – API RESTful → Nuevos endpoints con versioning
8. **Batch 7** – Testing & Cutover → QA y migración gradual

---

## 9. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Imports broken after moves | High | High | Automated script + VS Code global replace + thorough testing |
| Circular dependencies introduced | Medium | High | `madge --circular` checks in CI |
| Runtime failures in production | Medium | High | Feature flag gradual rollout, legacy fallback |
| Domain logic breakage | Low | High | Unit tests for domain before move |
| Frontend breakage | High | Medium | Keep legacy routes until frontend migrated |

---

## 10. Next Steps

1. Review and approve ADR #1
2. Generate migration spreadsheet (all files)
3. Write auto-migration script
4. Execute Batch 1 in small increments
5. After each batch: `tsc`, `lint`, `test:unit`, `test:e2e`

---

**END OF ANALYSIS**