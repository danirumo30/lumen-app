# Arquitectura de Lumen App

## Visión General

Lumen App es una plataforma de seguimiento de medios (películas, series, videojuegos) con componentes sociales. La arquitectura sigue **Clean Architecture + DDD + Hexagonal** para garantizar:

- **Independencia de frameworks**: El dominio no depende de Next.js, React, Supabase, etc.
- **Testabilidad**: Cada capa puede probarse en aislamiento.
- **Mantenibilidad**: Límites claros, baja accidental complejidad.
- **Flexibilidad**: Cambiar infraestructura (ej. Supabase → PostgreSQL directo) sin afectar dominio.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| State Management | React Query (TanStack Query v5) |
| Backend | Next.js API Routes (Serverless) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + custom email verification |
| Email | Nodemailer (SMTP) + SendGrid (producción) |
| External APIs | TMDB (películas/series), IGDB (videojuegos) |

## Diagrama de Capas (C4 Model - Container Level)

```mermaid
graph TB
    subgraph "Cliente"
        UI[React/Next.js UI]
        RQ[React Query Cache]
    end

    subgraph "Aplicación (Next.js)"
        API[API Routes]
        APP[App Router Pages]
        CONTEXT[Contexts]
    end

    subgraph "Capa de Aplicación"
        COMMANDS[Commands]
        QUERIES[Queries]
        DTOs[Data Transfer Objects]
    end

    subgraph "Capa de Dominio"
        ENTITIES[Entidades]
        VO[Value Objects]
        REPO[Repositorios (Ports)]
        EVENTS[Domain Events]
        SERVICES[Domain Services]
    end

    subgraph "Capa de Infraestructura"
        ADAPTERS[Adapters]
        PERSISTENCE[Supabase Adapters]
        EXTERNAL[TMDB/IGDB Clients]
        EMAIL[Nodemailer/SendGrid]
        HOOKS[React Hooks]
    end

    subgraph "Servicios Externos"
        DB[(Supabase PostgreSQL)]
        TMDB[(TMDB API)]
        IGDB[(IGDB API)]
        SMTP[SMTP Server]
    end

    UI --> APP
    RQ -.-> API
    APP --> COMMANDS
    APP --> QUERIES
    COMMANDS --> ENTITIES
    QUERIES --> ENTITIES
    COMMANDS --> REPO
    QUERIES --> REPO
    REPO -.-> PERSISTENCE
    ENTITIES --> VO
    ENTITIES --> EVENTS
    SERVICES --> ENTITIES
    ADAPTERS --> PERSISTENCE
    ADAPTERS --> EXTERNAL
    ADAPTERS --> EMAIL
    HOOKS --> COMMANDS
    HOOKS --> QUERIES
    PERSISTENCE --> DB
    EXTERNAL --> TMDB
    EXTERNAL --> IGDB
    EMAIL --> SMTP
```

## Flujo de una Request: Ejemplo Perfil de Usuario

### Escenario: Ver perfil de usuario (`/profile/[username]`)

```
1. Usuario navega a /profile/johndoe
   └─ Next.js App Router renderiza ProfilePage (Server Component)

2. ProfilePage llama a getProfile.query.ts (Application Layer)
   └─ DTO: GetProfileQuery { username: string }
   └─ Orquesta: ProfileQueryHandler.execute(query)

3. ProfileQueryHandler usa:
   └─ UserProfileRepository (port del dominio)
   └─ UserRepository (port del dominio)
   └─ UserMediaTrackingRepository (port del dominio)

4. Repositorios invocados:
   └─ UserProfileRepository.findByUsername(username)
     └─ Delegado a SupabaseUserProfileRepository (infraestructura)
     └─ SQL: SELECT * FROM user_profiles WHERE username = ?
   
   └─ UserRepository.findById(userId)
     └─ SupabaseUserRepository.findById()
   
   └─ UserMediaTrackingRepository.findByUserId(userId)
     └─ SupabaseUserMediaTrackingRepository.findByUser()
     └─ SQL: SELECT * FROM user_media_tracking WHERE user_id = ?

5. Datos devueltos al query handler
   └─ Mapea a GetProfileDto
   └─ Calcula stats (totales, ratios)

6. ProfilePage recibe DTO y renderiza:
   └─ ProfileHeader (avatar, bio, stats)
   └─ MediaGrid (películas, series, juegos)
   └─ FollowersModal (si es público)

7. Frontend puede mutar estado:
   └─ useFollowUser.hook.ts (infrastructure/hooks/)
   └─ Invoca: FollowUserCommand.execute({ followerId, followingId })
   └─ FollowUserHandler:
       - Valida reglas de dominio (no autoseguirse)
       - FollowRepository.save(follow)
       - Dispara DomainEvent: UserFollowed
       - React Query invalida queries de perfil
```

## Principios de Diseño

### 1. Regla de Dependencias (Dependency Rule)
Las dependencias apuntan **hacia adentro**:
- API Routes → Application → Domain ← Infrastructure
- Infrastructure implementa interfaces definidas en Domain
- Domain nunca conoce Infrastructure

### 2. One Aggregate per Transaction
Cada transacción (comando) opera sobre **un solo aggregate root**:
- `User` aggregate → UserRepository
- `Media` aggregate → MediaRepository (contenido)
- `UserProfile` aggregate → UserProfileRepository (social)
- `UserMediaState` aggregate → UserMediaTrackingRepository (seguimiento)

### 3. Domain Events para Comunicación Cross-Context
Eventos definidos en Shared, publicados por aggregates, consumidos por otros contexts:
- `UserRegistered` → Social context crea UserProfile
- `EmailVerified` → Auth actualiza flags
- `MediaToggled` → Social actualiza stats
- `UserFollowed` → Auth notifica (opcional)

### 4. CQRS Ligero
- **Commands**: Operaciones de escritura (`src/application/*/commands/`)
- **Queries**: Operaciones de lectura (`src/application/*/queries/`)
- No requiere modelos separados de comando/consulta (mismos DTOs)

## Bounded Contexts

| Context | Responsabilidad | Aggregate Roots | Ubicación |
|---------|----------------|-----------------|-----------|
| **Auth** | Identidad, autenticación, autorización, verificación | `User` | `src/domain/auth/` |
| **Media** | Catálogo, descubrimiento, detalles, seguimiento | `Media` | `src/domain/media/` |
| **Social** | Perfiles, seguidores, estadísticas sociales | `UserProfile` | `src/domain/social/` |
| **Shared** | Value objects, errores, eventos base | — | `src/domain/shared/` |

## Estructura de Carpetas (Canonical)

```
src/
├── domain/
│   ├── auth/
│   │   ├── entities/          # User, (UserMediaState se mueve a media?)
│   │   ├── value_objects/    # Email, Username, Password, FullName
│   │   ├── events/           # UserRegistered, EmailConfirmed, PasswordReset
│   │   ├── repository/       # UserRepository (port)
│   │   ├── services/         # AuthService, TokenService (domain logic)
│   │   └── index.ts
│   ├── media/
│   │   ├── entities/         # Media (root), Tv, Movie, Game, Episode, UserMediaState
│   │   ├── value_objects/    # MediaId, TrackingStatus, MediaType, EpisodeId
│   │   ├── events/           # MediaToggled, MediaStatusUpdated
│   │   ├── repository/       # MediaRepository, UserMediaTrackingRepository
│   │   ├── services/         # MediaMatcher, EpisodeMatcher
│   │   └── index.ts
│   ├── social/
│   │   ├── entities/         # UserProfile, Follow (optional aggregate)
│   │   ├── value_objects/    # UsernameVO, UserStats, Bio
│   │   ├── events/           # ProfileUpdated, UserFollowed, UserUnfollowed
│   │   ├── repository/       # UserProfileRepository, FollowRepository
│   │   ├── services/         # FollowService, StatsService
│   │   └── index.ts
│   └── shared/
│       ├── errors/           # DomainError, InvalidUserMediaStateError, etc.
│       ├── value-objects/    # EntityId base, Result<T>, Option<T>
│       ├── events/           # DomainEvent (base), EventMetadata
│       ├── models/           # DTOs base, enums
│       └── index.ts
├── application/
│   ├── auth/
│   │   ├── commands/         # LoginCommand, RegisterCommand, LogoutCommand, etc.
│   │   ├── queries/          # GetCurrentUserQuery, GetProfileQuery, etc.
│   │   ├── dto/               # AuthDto (LoginDto, RegisterDto, UserDto)
│   │   ├── ports/            # IEmailService, ITokenService, IAuthRepository
│   │   └── index.ts
│   ├── media/
│   │   ├── commands/         # MarkAsWatchedCommand, ToggleFavoriteCommand, SaveMediaStateCommand
│   │   ├── queries/          # GetMediaStateQuery, GetUserMediaQuery, GetUserStatsQuery
│   │   ├── dto/               # MediaDto, EpisodeDto, UserMediaStateDto
│   │   ├── ports/            # ITmdbClient, IIgdbClient, IMediaRepository
│   │   └── index.ts
│   ├── social/
│   │   ├── commands/         # FollowUserCommand, UnfollowUserCommand, UpdateProfileCommand
│   │   ├── queries/          # GetProfileQuery, SearchUsersQuery, GetFollowersQuery
│   │   ├── dto/               # UserProfileDto, FollowDto, SearchResultDto
│   │   ├── ports/            # IProfileRepository, IFollowRepository
│   │   └── index.ts
│   └── shared/               # Middleware de aplicación, validadores genéricos
├── infrastructure/
│   ├── persistence/
│   │   └── supabase/
│   │       ├── auth/
│   │       │   ├── supabase-auth.repository.ts
│   │       │   ├── email/
│   │       │   │   ├── supabase-email.service.ts
│   │       │   │   └── nodemailer.adapter.ts
│   │       │   └── index.ts
│   │       ├── media/
│   │       │   ├── supabase-media.repository.ts
│   │       │   ├── supabase-episode.repository.ts
│   │       │   ├── supabase-user-media.repository.ts
│   │       │   └── index.ts
│   │       ├── social/
│   │       │   ├── supabase-profile.repository.ts
│   │       │   ├── supabase-follow.repository.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   ├── external/
│   │   ├── tmdb/
│   │   │   ├── tmdb.client.ts
│   │   │   ├── tmdb.mapper.ts
│   │   │   └── index.ts
│   │   ├── igdb/
│   │   │   ├── igdb.client.ts
│   │   │   ├── igdb.mapper.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── email/
│   │   │   ├── email.service.ts (interface)
│   │   │   ├── nodemailer.adapter.ts
│   │   │   ├── sendgrid.adapter.ts
│   │   │   └── index.ts
│   │   ├── translation/
│   │   │   └── translation.service.ts
│   │   └── index.ts
│   ├── http/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── api-response.ts
│   │   ├── errors/
│   │   │   ├── http-exception.ts
│   │   │   └── error-mapper.ts
│   │   └── index.ts
│   ├── react-query/
│   │   ├── query-client.tsx
│   │   ├── hooks/
│   │   │   ├── use-auth.hook.ts
│   │   │   ├── use-profile.hook.ts
│   │   │   ├── use-media.hook.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── contexts/
│   │   └── auth-context.tsx
│   ├── hooks/
│   │   ├── use-episode-toggle.ts
│   │   ├── use-batch-episode-toggle.ts
│   │   ├── use-watched-episodes.ts
│   │   ├── use-profile-stats.hook.ts
│   │   └── index.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   └── index.ts
│   └── index.ts
├── shared/
│   ├── get-base-url.ts
│   ├── logger.ts
│   ├── platforms.ts
│   ├── translate.ts
│   └── index.ts
├── types/
│   ├── supabase.ts
│   ├── tmdb/
│   ├── igdb/
│   └── shared/
└── app/
    ├── api/                  # API Routes (Next.js)
    ├── auth/
    ├── discover/
    ├── profile/
    ├── movie/
    ├── tv/
    ├── game/
    ├── rankings/
    ├── search/
    └── components/          # Server Components (UI)
```

## Convenciones de Nombrado

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Bounded Context | kebab-case (directorio) | `auth`, `media`, `social` |
| Aggregate Root | PascalCase + `Entity` | `UserEntity`, `MediaEntity` |
| Value Objects | PascalCase + `VO` o `ValueObject` | `EmailVO`, `UsernameVO` |
| Domain Events | PascalCase + `Event` | `UserRegisteredEvent` |
| Repository (port) | `I{PascalCase}Repository` | `IUserRepository` |
| Repository (impl) | `Supabase{PascalCase}Repository` | `SupabaseUserRepository` |
| Commands | `{Verb}{Noun}Command` | `RegisterUserCommand`, `MarkAsWatchedCommand` |
| Queries | `Get{Noun}Query` | `GetProfileQuery`, `GetUserMediaQuery` |
| DTOs | `{Noun}Dto` | `UserDto`, `MediaDto` |
| Services (domain) | `{Domain}Service` | `AuthService`, `FollowService` |
| Services (infra) | `{Technology}Adapter` | `NodemailerAdapter`, `TmdbAdapter` |

## Reglas de Import

### Alias de path
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/domain/*": ["./src/domain/*"],
      "@/application/*": ["./src/application/*"],
      "@/infrastructure/*": ["./src/infrastructure/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

### Prohibido
- Importar desde `src/lib/` (debe migrar a infrastructure)
- Importar desde `src/modules/` (estructura obsoleta)
- Importar de infrastructure hacia domain (viola regla de dependencias)
- Importar de application hacia infrastructure

## Calidad y Validación

### Scripts npm
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test"
  }
}
```

### Linting
- ESLint con configuración Next.js + TypeScript
- Reglas estrictas: `@typescript-eslint/no-explicit-any`, `no-unused-vars`
- Excluir: `node_modules`, `.next`, `tests/e2e`

### TypeScript
- `strict: true`
- `noEmit: true` (en desarrollo)
- `isolatedModules: true`

### Tests
- **Unitarios**: Domain layer, services, value objects
- **Integración**: API routes con Supabase mockeado
- **E2E**: Playwright (flujos completos)

## Estado Actual (Marzo 2026)

✅ **Completado**:
- Migración de `src/modules/` a `src/domain/`, `src/application/`, `src/infrastructure/`
- Bounded contexts definidos (Auth, Media, Social, Shared)
- Repositorios reestructurados (uno por aggregate, no por tabla)
- Tests unitarios e integración funcionando (2 fallos conocidos)
- TypeCompilation OK

⚠️ **Pendiente**:
- Enriquecer domain con Value Objects completos
- Implementar Domain Events (event bus, subscribers)
- Refactorizar API routes a RESTful + versioning
- Limpiar lint errors en archivos de migration y tests
- Documentar ADRs faltantes

---

**Próximo**: [Domain Layer Details](./domain.md)
