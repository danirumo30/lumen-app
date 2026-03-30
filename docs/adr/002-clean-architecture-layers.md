# ADR 002: Clean Architecture Layers Definition

**Status:** Accepted  
**Date:** 2026-03-29  
**Commit:** 957959f  

---

## Context

Necesitamos definir formalmente las capas de Clean Architecture para Lumen App, estableciendo reglas de dependencia y responsabilidad de cada una.

## Decision

Adoptamos el modelo **Clean Architecture** (Robert C. Martin) con 4 capas:

```
┌─────────────────────────────────────────────────────┐
│                   Entities (Domain)                  │
│   Enterprise-wide business rules & entities         │
│   DTOs, Value Objects, Domain Events, Errors        │
└─────────────────────────────────────────────────────┘
                        ▲
                        │ depends on
┌─────────────────────────────────────────────────────┐
│                Use Cases (Application)               │
│   Application-specific business rules               │
│   Commands, Queries, DTOs, Ports (interfaces)       │
└─────────────────────────────────────────────────────┘
                        ▲
                        │ depends on
┌─────────────────────────────────────────────────────┐
│          Interface Adapters (Infrastructure)         │
│   Presenters, Controllers, Adapters, Repositories   │
│   Supabase, TMDB, IGDB, Email, HTTP middleware      │
└─────────────────────────────────────────────────────┘
                        ▲
                        │ depends on
┌─────────────────────────────────────────────────────┐
│          Frameworks & Drivers (External)             │
│   Next.js, React, PostgreSQL, SMTP, External APIs   │
└─────────────────────────────────────────────────────┘
```

### Regla de Dependencias (The Dependency Rule)

> Las dependencias **solo** apuntan hacia adentro.

```
Frameworks → Infrastructure → Application → Domain
```

- **Domain** no conoce nada de las capas exteriores
- **Application** solo conoce **Domain** (ports/interfaces)
- **Infrastructure** conoce **Application** y **Domain** (implementa ports)
- **Frameworks** es lo más externo (Next.js, PostgreSQL, React)

### Responsabilidades por Capa

#### Domain Layer (`src/domain/`)

**Propósito**: Contener toda la lógica de negocio pura, independiente de tecnología.

**Contenido**:
- **Entities**: Objetos con identidad y ciclo de vida (User, Media, UserProfile)
- **Value Objects**: Inmutables, igualdad por valor (Email, Username, MediaId)
- **Aggregates**: Agrupaciones de entidades con invariante (User con sus datos, Media con sus tipos)
- **Repository ports**: Interfaces (IUserRepository), **NO** implementaciones
- **Domain services**: Lógica que no encaja en una entidad (AuthService, FollowService)
- **Domain events**: Eventos de negocio (UserRegistered, EmailVerified)
- **Domain errors**: Jerarquía de errores (ValidationError, NotFoundError)

**Restricciones**:
- ❌ No puede importar de `application/`, `infrastructure/`, `shared/`
- ❌ No puede usar `fetch`, `fs`, `Response`, `Request`, `Next.js`
- ✅ Solo JavaScript/TypeScript puro

#### Application Layer (`src/application/`)

**Propósito**: Orquestar casos de uso, coordinar dominios, definir contratos.

**Contenido**:
- **Commands**: Operaciones de escritura (RegisterUserCommand, MarkAsWatchedCommand)
- **Queries**: Operaciones de lectura (GetProfileQuery, GetTrendingMediaQuery)
- **DTOs**: Data Transfer Objects para inputs/outputs
- **Application services** (o "Use Case Handlers"): Implementan la orquestación
- **Ports (interfaces)**: Define contratos para servicios externos (IEmailService)

**Restricciones**:
- ❌ No puede contener lógica de negocio (delega al domain)
- ❌ No puede acceder a DB directamente (usa repositorios)
- ❌ No puede implementar puertos (eso es infrastructure)
- ✅ Puede importar solo puertos del domain, no implementaciones

#### Infrastructure Layer (`src/infrastructure/`)

**Propósito**: Adaptar el mundo exterior a los contratos del dominio.

**Contenido**:
- **Repository implementations**: SupabaseUserRepository (implementa IUserRepository)
- **External service adapters**: TMDbAdapter (implementa ITmdbClient), NodemailerAdapter
- **HTTP concerns**: Middleware (auth, rate-limit), error mappers, api-response helpers
- **React Query hooks**: useAuth, useProfile (conectan UI con commands/queries)
- **React Contexts**: AuthContext (legacy, en transición a hooks)
- **Clients**: Supabase singleton, fetch wrappers

**Restricciones**:
- ❌ No debe contener lógica de negocio (solo mapeo, validación de transporte)
- ✅ Puede importar de domain (ports) y application (DTOs)
- ✅ Puede usar librerías externas (Supabase, Nodemailer, fetch)

#### Framework Layer (Externo)

**Propósito**: Tecnologías concretas que ejecutan la aplicación.

**Ejemplos**:
- Next.js (App Router, API Routes)
- React (Componentes, Server Components)
- PostgreSQL/Supabase (motor de base de datos)
- Node.js APIs (fs, http, crypto)
- Servicios externos (TMDB, IGDB, SendGrid)

## Mapeo de Carpetas a Capas

| Capa | Directorio | Responsabilidad |
|------|------------|-----------------|
| Domain | `src/domain/` | Business logic pure |
| Application | `src/application/` | Use cases orchestration |
| Infrastructure | `src/infrastructure/` | Adapters, frameworks glue |
| Shared (App) | `src/shared/` | Technical utilities |
| Types | `src/types/` | External API types |
| UI | `src/components/`, `src/app/` | Presentation (Next.js) |

## Dependency Rule en Práctica

### ❌ Anti-pattern: Domain importa Infrastructure

```typescript
// src/domain/auth/entities/user.entity.ts
import { supabase } from '@/infrastructure/supabase/client';  // ❌ NO!
```

### ✅ Correcto: Domain define interface, Infrastructure implementa

```typescript
// src/domain/auth/repository/user-repository.port.ts
export interface IUserRepository {
  findById(id: string): Promise<User>;
}

// src/infrastructure/persistence/supabase/auth/supabase-auth.repository.ts
export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseClient) {}
  async findById(id: string): Promise<User> { ... }
}
```

### ❌ Anti-pattern: Application contiene lógica de negocio

```typescript
// src/application/auth/commands/register.command.ts (WRONG)
if (email.endsWith('@admin.com')) {
  user.isAdmin = true;  // ❌ Regla de negocio en Application!
}
```

### ✅ Correcto: Domain encapsula invariantes

```typescript
// src/domain/auth/entities/user.entity.ts
static register(email, username, password) {
  if (email.value.endsWith('@admin.com')) {
    throw new ValidationError('No se permiten emails de admin en registro público');
  }
  return new User(...);
}
```

## Consejos para Mantener la Arquitectura

1. **Code Owners**: Asignar dueños de capa para revisiones
2. **ESLint rule**: `no-restricted-imports` para bloquear imports ilegales
3. **Codemods**: Scripts automáticos para refactor moves
4. **CI check**: `madge --circular` para detectar ciclos
5. **Tests**: Cada capa prueba en aislamiento (domain sin DB, infra con mocks)

## Diagrama de Flujo de Dependencias

```
[UI Layer: React Components]
         ▲
         │ uses hooks from
         │
[Infrastructure: React Query Hooks]
         ▲
         │ executes
         │
[Application: Commands/Queries]
         ▲
         │ uses repositories (interfaces)
         │
[Domain: Entities, Value Objects]
         ▲
         │ implemented by
         │
[Infrastructure: Supabase Repos]
         ▲
         │ uses client
         │
[Frameworks: Supabase JS client → PostgreSQL]
```

## Consequences

### Positivas
- **Testabilidad**: Domain test sin mocks, infra test con mocks de domain
- **Mantenibilidad**: Cambiar DB o framework sin romper dominio
- **Claridad**: Cada desarrollador sabe dónde va cada cosa
- **Flexibilidad**: Swap infra sin reescribir negocio

### Negativas
- **Curva de aprendizaje**: Necesita entender DDD + Hexagonal
- **Boilerplate**: Más archivos, más interfaces
- **Over-engineering**: Para proyectos simples, puede ser exceso
- **Disciplina**: Requiere rigurosidad en imports

---

**Referencias**:
- Clean Architecture – Robert C. Martin
- Hexagonal Architecture – Alistair Cockburn
- Domain-Driven Design – Eric Evans
- Skill: `clean-ddd-hexagonal`
