# Lumen App

**Social Media Entertainment Platform** – Seguimiento de películas, series y videojuegos con componente social.

Stack: **Next.js 16 + React Query + Supabase + Clean Architecture + DDD**.

## 🏗️ Arquitectura

Lumen sigue **Clean Architecture + Domain-Driven Design (DDD) + Hexagonal**:

```
Frameworks (Next.js, React, Supabase)
     ↓
Infrastructure (Adapters: Supabase repos, TMDB client, Email service)
     ↓
Application (Commands, Queries, DTOs, Ports)
     ↓
Domain (Entities, Value Objects, Domain Services, Events)
```

**Bounded Contexts**:

| Contexto | Responsabilidad | Ubicación |
|----------|----------------|-----------|
| `auth` | Autenticación, autorización, verificación email | `src/domain/auth/` |
| `media` | Catálogo, discovery, seguimiento de contenido | `src/domain/media/` |
| `social` | Perfiles, seguidores, estadísticas | `src/domain/social/` |
| `shared` | Value objects, errores, eventos base | `src/domain/shared/` |

📖 Ver [Arquitecture Overview](./docs/architecture/overview.md)

## 📁 Estructura de Carpetas

```
src/
├── app/                     # Next.js App Router (pages, layouts, API routes)
│   ├── api/                 # API Routes (REST endpoints)
│   ├── auth/                # Auth pages (login, register, reset)
│   ├── discover/            # Discover page
│   ├── profile/             # User profiles
│   ├── movie/               # Movie detail pages
│   ├── tv/                  # TV detail pages
│   ├── game/                # Game detail pages
│   └── components/          # Server Components (UI)
├── components/              # Client Components (React)
│   ├── auth/                # Auth UI (LoginModal, VerificationMessage)
│   ├── discover/            # Discover components
│   ├── home/                # Homepage carousels
│   ├── layout/              # Header, Footer
│   ├── profile/             # Profile components
│   ├── ui/                  # shadcn/ui base components
│   └── ...
├── domain/                  # DDD Domain Layer (Pure logic)
│   ├── auth/
│   │   ├── entities/       # User entity
│   │   ├── value_objects/  # Email, Username, Password
│   │   ├── events/         # Domain events
│   │   ├── repository/     # IUserRepository (port)
│   │   └── services/       # AuthService, TokenService
│   ├── media/
│   │   ├── entities/       # Media, Tv, Movie, Game, Episode, UserMediaState
│   │   ├── value_objects/  # MediaId, TrackingStatus, MediaType
│   │   ├── events/
│   │   ├── repository/     # IMediaRepository, IUserMediaTrackingRepository
│   │   └── services/
│   ├── social/
│   │   ├── entities/       # UserProfile, Follow
│   │   ├── value_objects/  # UserStats, Bio
│   │   ├── events/
│   │   ├── repository/     # IUserProfileRepository
│   │   └── services/
│   └── shared/
│       ├── errors/         # DomainError, ValidationError, etc.
│       ├── value-objects/  # EntityId, Result<T>, Option<T>
│       └── events/         # DomainEvent base, EventBus port
├── application/             # Application Layer (Use Cases)
│   ├── auth/
│   │   ├── commands/       # LoginCommand, RegisterCommand, etc.
│   │   ├── queries/        # GetProfileQuery, GetCurrentUserQuery
│   │   ├── dto/            # LoginDto, UserDto, etc.
│   │   └── ports/          # IEmailService, ITokenService
│   ├── media/
│   │   ├── commands/       # MarkAsWatchedCommand, ToggleFavoriteCommand
│   │   ├── queries/        # GetUserMediaQuery, GetMediaStateQuery
│   │   ├── dto/            # MediaDto, UserMediaStateDto
│   │   └── ports/          # ITmdbClient, IMediaRepository
│   ├── social/
│   │   ├── commands/       # FollowUserCommand, UpdateProfileCommand
│   │   ├── queries/        # GetProfileQuery, SearchUsersQuery
│   │   ├── dto/            # UserProfileDto, FollowDto
│   │   └── ports/          # IProfileRepository
│   └── shared/
│       ├── middleware/     # Validation, authz middleware
│       └── dto/            # ApiResponseDto, PaginatedResult
├── infrastructure/          # Infrastructure Layer (Adapters)
│   ├── persistence/
│   │   └── supabase/
│   │       ├── auth/       # SupabaseUserRepository, email service
│   │       ├── media/      # SupabaseMediaRepository, UserMediaTrackingRepo
│   │       ├── social/     # SupabaseProfileRepository
│   │       └── index.ts
│   ├── external/
│   │   ├── tmdb/           # TmdbClient (ITmdbClient impl), mappers
│   │   ├── igdb/           # IgdbClient (IIgdbClient impl), mappers
│   │   └── index.ts
│   ├── services/
│   │   ├── email/          # EmailService (IEmailService): Nodemailer, SendGrid
│   │   └── translation/
│   ├── http/
│   │   ├── middleware/     # Auth, rate-limit, error middleware
│   │   ├── api-response.ts
│   │   ├── errors/         # HttpException, ErrorMapper
│   │   └── index.ts
│   ├── react-query/        # TanStack Query config
│   │   ├── query-client.tsx
│   │   ├── hooks/          # useAuth, useProfile, useMedia
│   │   └── index.ts
│   ├── contexts/           # React Contexts (AuthContext)
│   ├── hooks/              # Custom hooks (useEpisodeToggle, useBatchToggle)
│   └── supabase/           # Supabase client singleton
├── shared/                 # App-level utilities (non-domain)
│   ├── get-base-url.ts    # Determine server/client URL
│   ├── logger.ts          # Pino/Winston logger
│   ├── platforms.ts       # Platform detection (web, mobile, tv)
│   └── translate.ts       # i18next wrapper
├── types/                  # External API types
│   ├── supabase.ts        # Generated from Supabase schema
│   ├── tmdb/              # TMDB API types
│   ├── igdb/              # IGDB API types
│   └── shared/            # Shared generic types
└── lib/                   # ❌ DEPRECATED – migrating to infrastructure/shared
```

📖 Ver [Development Guides](./docs/development/)

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm o yarn
- Supabase account
- TMDB API key
- (Optional) SendGrid account for production emails

### Installation

```bash
# Clone repo
git clone https://github.com/your-org/lumen-app.git
cd lumen-app

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials, API keys

# Run dev server
npm run dev
# Open http://localhost:3000
```

### Environment Variables (.env.local)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # server-side only

# TMDB
TMDB_API_KEY=your_tmdb_key

# IGDB (client credentials flow)
IGDB_CLIENT_ID=your_igdb_client_id
IGDB_CLIENT_SECRET=your_igdb_client_secret

# Email (dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@lumen.app

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=super_secret_random_string_for_jwt
NODE_ENV=development
```

### Database Setup (Supabase)

1. Crear proyecto en Supabase
2. Ejecutar migraciones SQL en `supabase/migrations/`
3. Configurar Auth:
   - Enable email/password provider
   - **IMPORTANTE**: Deshabilitar "Enable email confirmations" (usamos sistema custom)
4. Configurar Storage (si se usa para avatares)
5. Configurar Row Level Security (RLS) policies según necesidades

## 📜 Scripts Disponibles

```bash
# Development
npm run dev           # Next.js dev server
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint check
npm run type-check    # TypeScript compiler (no emit)

# Testing
npm test              # Vitest (unit + integration)
npm run test:unit     # Solo unit tests
npm run test:integration  # Solo integration tests
npm run test:e2e      # Playwright e2e tests
npm run test:coverage  # Coverage report

# Utilities
npm run db:push       # Push local DB changes (supabase db push)
npm run db:studio     # Open Supabase Studio
```

## 🧪 Testing Strategy

- **Unit**: Domain layer, use cases, value objects (Vitest)
- **Integración**: API routes + Supabase mock/test DB
- **E2E**: Flujos completos en browser (Playwright)

📖 Ver [Testing Strategy](./docs/development/testing.md)

## 📖 Documentación

### Arquitectura

- [Overview](./docs/architecture/overview.md) – Visión general, diagramas, flujos
- [Domain Layer](./docs/architecture/domain.md) – Entidades, VO, aggregates, events
- [Application Layer](./docs/architecture/application.md) – Commands, queries, DTOs
- [Infrastructure Layer](./docs/architecture/infrastructure.md) – Adaptadores, repos, hooks
- [Shared Utilities](./docs/architecture/shared.md) – Shared layer details

### ADRs (Architecture Decision Records)

- [ADR 001: Bounded Contexts and Aggregates](./docs/adr/001-bounded-contexts-aggregates.md)
- [ADR 002: Clean Architecture Layers](./docs/adr/002-clean-architecture-layers.md)
- [ADR 003: Value Objects and Entities](./docs/adr/003-value-objects-and-entities.md)
- [ADR 004: Repository Pattern](./docs/adr/004-repository-pattern.md)
- [ADR 005: Event-Driven Domain Events](./docs/adr/005-event-driven-domain-events.md) (Under Consideration)
- [ADR 006: CQRS and Commands/Queries](./docs/adr/006-cqrs-and-commands-queries.md)
- [ADR 007: Migration Strategy](./docs/adr/007-migration-strategy.md)

### Development Guides

- [Coding Conventions](./docs/development/coding-conventions.md) – TypeScript, naming, structure
- [Testing Strategy](./docs/development/testing.md) – Unit, integration, e2e
- [Commit Messages](./docs/development/commit-messages.md) – Conventional Commits

### Implementation Records

- [IMPLEMENTATION_SUMMARY](./docs/IMPLEMENTATION_SUMMARY.md) – Custom email verification system
- [ARCHITECTURE_ANALYSIS](./docs/architecture-analysis.md) – Current state analysis (commit 957959f)

## 🔧 Convenciones de Código

- **TypeScript strict mode** activado
- **Sin `any`** (excepto tests y casos edge)
- **Clean Architecture** – dependencias apuntan hacia el dominio
- **Bounded Contexts** claros: auth, media, social
- **One aggregate per transaction**
- **Commands/Queries** separados (CQRS ligero)
- **React Query** para state management de server state
- **shadcn/ui** + Tailwind v4 para UI

📖 Ver [Coding Conventions](./docs/development/coding-conventions.md)

## 🔀 Flujo de Trabajo

1. **Feature branch**: `git checkout -b feat/auth-email-verification`
2. **Desarrollar** con tests unitarios primero
3. **Commit** con Conventional Commits:
   ```bash
   git add .
   git commit -m "feat(auth): add email verification modal"
   ```
4. **Push** y abrir PR
5. **CI** corre: lint, type-check, tests
6. **Review** por teammate
7. **Merge** a `main` (squash merge recomendado)
8. **Release** automático con `release-please` (semver)

## 📊 Quality Gates

- ✅ TypeScript compila sin errores (`tsc --noEmit`)
- ✅ Lint supera el 90% de reglas estrictas
- ✅ Tests unitarios: >80% coverage
- ✅ Tests de integración pasan
- ✅ E2E smoke tests pasan (critical paths)
- ✅ Build exitoso (`npm run build`)

## 🐛 Issues y Bug Reports

Reportar bugs en [GitHub Issues](https://github.com/your-org/lumen-app/issues). Incluir:

- Pasos para reproducir
- Expected vs actual behavior
- Environment (OS, browser, app version)
- Screenshots si aplica
- Console logs

## 🤝 Contributing

Contribuciones bienvenidas. Por favor:

1. Fork el repo
2. Crear branch para feature (`feat/...`) o fix (`fix/...`)
3. Seguir [coding conventions](./docs/development/coding-conventions.md)
4. Escribir tests parachanges
5. Commit con [conventional commits](./docs/development/commit-messages.md)
6. PR con descripción clara y linked issue

## 📄 License

[ISC](LICENSE) – ver archivo para detalles.

## 🙏 Créditos

- Arquitectura: Clean Architecture + DDD + Hexagonal
- Frontend: Next.js 16, React 19, Tailwind v4, shadcn/ui
- Backend: Supabase, PostgreSQL, Node.js
- APIs: TMDB, IGDB
- Testing: Vitest, Playwright

---

**Estado**: En desarrollo activo. Última migración arquitectónica: 2026-03-29 (commit 957959f).
