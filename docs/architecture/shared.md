# Shared Utilities - Guía Detallada

## Propósito

El módulo `src/shared/` contiene utilidades genéricas usadas en toda la aplicación que no pertenecen a ningún bounded context específico. Es la caja de herramientas transversal.

## Estructura Actual

```
src/
├── shared/
│   ├── get-base-url.ts    # Detecta URL base (dev/prod)
│   ├── logger.ts          # Logger Winston/Pino wrapper
│   ├── platforms.ts       # Plataforma: 'web', 'mobile', 'tv'
│   ├── translate.ts       # I18n helper (i18next)
│   └── index.ts
├── types/
│   ├── supabase.ts        # Tipos generados de Supabase
│   ├── tmdb/              # Tipos TMDB API
│   ├── igdb/              # Tipos IGDB API
│   └── shared/            # Tipos genéricos
└── (en domain/shared/ también hay VO/errores/eventos base)
```

## Contenido de `src/shared/`

### 1. `get-base-url.ts`

Determina la URL base del servidor según el entorno:

```typescript
// src/shared/get-base-url.ts
export function getBaseUrl(request?: Request): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side (Next.js)
  if (request) {
    const host = request.headers.get('host')!;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }

  // Fallback para build estático
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
```

**Uso**:
```typescript
import { getBaseUrl } from '@/shared';
const baseUrl = getBaseUrl(request);  // En API route
```

### 2. `logger.ts`

Wrapper de logging estructurado:

```typescript
// src/shared/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : pino.destination(1),
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
    }),
    err: pino.stdSerializers.err,
  },
});

export default logger;
```

**Uso**:
```typescript
import logger from '@/shared/logger';
logger.info('User logged in', { userId, ip });
logger.error('Database error', error);
```

### 3. `platforms.ts`

Detecta plataforma de la request (para UI responsive):

```typescript
// src/shared/platforms.ts
export type Platform = 'web' | 'mobile' | 'tv';

export function detectPlatform(userAgent?: string): Platform {
  if (!userAgent) return 'web';
  
  const ua = userAgent.toLowerCase();
  if (ua.includes('tv') || ua.includes('googletv') || ua.includes('webkit')) return 'tv';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'mobile';
  return 'web';
}

export function isMobile(platform: Platform): boolean {
  return platform === 'mobile';
}

export function isTv(platform: Platform): boolean {
  return platform === 'tv';
}
```

**Uso**:
```typescript
import { detectPlatform } from '@/shared/platforms';
const platform = detectPlatform(request.headers.get('user-agent'));
if (isMobile(platform)) {
  // Mostrar UI mobile
}
```

### 4. `translate.ts`

Wrapper para i18next:

```typescript
// src/shared/translate.ts
import i18next from 'i18next';

export function t(
  key: string,
  options?: Record<string, any>,
  lng?: string
): string {
  return i18next.t(key, { ...options, lng });
}

export function changeLanguage(lng: string): Promise<void> {
  return i18next.changeLanguage(lng);
}
```

**Uso**:
```typescript
import { t } from '@/shared/translate';
<h1>{t('home.welcome')}</h1>
```

## Tipos Compartidos (`src/types/`)

### Supabase Types

Generados automáticamente por `supabase gen types typescript`:

```typescript
// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          is_verified: boolean;
          email_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: { ... };
        Update: { ... };
      };
      user_profiles: { ... };
      user_media_tracking: { ... };
      // ... otras tablas
    };
    Views: {
      user_global_stats: { ... };
      trending_movies: { ... };
    };
    Functions: {
      verify_email_token: { ... };
      // ... funciones SQL
    };
    Enums: {
      media_type: 'movie' | 'tv' | 'game' | 'episode';
      tracking_status: 'watched' | 'favorite' | 'planned';
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
```

**Uso**:
```typescript
import type { Database, User } from '@/types/supabase';
const user: User = data;
```

### TMDB Types

```typescript
// src/types/tmdb/index.ts
export interface TmdbMovieDto {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  vote_average: number;
  // ...
}

export interface TmdbSearchResult {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  // ...
}
```

### IGDB Types

```typescript
// src/types/igdb/index.ts
export interface IgdbGameDto {
  id: number;
  name: string;
  summary: string;
  first_release_date: number;
  genres: { id: number; name: string }[];
  cover?: { url: string };
  screenshots?: { url: string }[];
  // ...
}
```

## Domain Layer Shared (`src/domain/shared/`)

**Nota**: Esto NO es `src/shared/` (aplicación). Esto es shared del **dominio**.

```
src/domain/shared/
├── errors/
│   ├── domain-error.ts
│   ├── validation-error.ts
│   ├── not-found-error.ts
│   ├── conflict-error.ts
│   ├── permission-denied-error.ts
│   └── index.ts
├── value-objects/
│   ├── entity-id.vo.ts
│   ├── result.ts
│   ├── option.ts
│   ├── email.vo.ts (¿mover de auth?)
│   ├── media-id.vo.ts (¿mover de media?)
│   └── index.ts
├── events/
│   ├── domain-event.base.ts
│   ├── event-metadata.vo.ts
│   ├── event-bus.port.ts
│   └── index.ts
└── models/
    ├── enums.ts
    ├── pagination.dto.ts
    └── index.ts
```

### Value Objects Base

```typescript
// src/domain/shared/value-objects/entity-id.vo.ts
export abstract class EntityId<T = string> {
  protected readonly _value: T;

  protected constructor(value: T) {
    this._value = value;
  }

  get value(): T {
    return this._value;
  }

  equals(other: EntityId<T>): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return String(this._value);
  }
}

// Implementación
export class UserId extends EntityId<string> {
  constructor(id: string) {
    super(id);
    // Validaciones específicas
    if (!isUUID(id)) throw new ValidationError('Invalid UserId');
  }
}
```

### Result Pattern

```typescript
// src/domain/shared/value-objects/result.ts
export class Result<T, E> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  static ok<T, E>(value?: T): Result<T, E> {
    return new Result(true, value);
  }

  static fail<T, E>(error: E): Result<T, E> {
    return new Result(false, undefined, error);
  }

  get isSuccess(): boolean { return this._isSuccess; }
  get isFailure(): boolean { return !this._isSuccess; }
  get value(): T {
    if (!this._isSuccess) throw new Error('Cannot get value of failed Result');
    return this._value as T;
  }
  get error(): E {
    if (this._isSuccess) throw new Error('Cannot get error of successful Result');
    return this._error as E;
  }

  // Fold / pattern matching
  match<R>(onSuccess: (value: T) => R, onFailure: (error: E) =>.R): R {
    return this._isSuccess ? onSuccess(this._value!) : onFailure(this._error!);
  }
}
```

**Uso**:
```typescript
const result = Result.ok<User, DomainError>(user);
// o
const result = Result.fail<User, DomainError>(new NotFoundError());

result.match(
  (user) => console.log('Found', user),
  (error) => console.error('Error', error)
);
```

### Option Pattern (nullable seguro)

```typescript
// src/domain/shared/value-objects/option.ts
export class Option<T> {
  private constructor(private readonly value: T | null) {}

  static some<T>(value: T): Option<T> {
    return new Option(value);
  }

  static none<T>(): Option<T> {
    return new Option(null);
  }

  static from<T>(value: T | null | undefined): Option<T> {
    return value != null ? Option.some(value) : Option.none();
  }

  isSome(): boolean { return this.value !== null; }
  isNone(): boolean { return this.value === null; }

  unwrap(): T {
    if (this.value === null) {
      throw new Error('Cannot unwrap None');
    }
    return this.value;
  }

  unwrapOr(defaultValue: T): T {
    return this.value !== null ? this.value : defaultValue;
  }

  map<U>(fn: (value: T) => U): Option<U> {
    return this.value !== null ? Option.some(fn(this.value)) : Option.none();
  }
}
```

**Uso**:
```typescript
const maybeUser: Option<User> = Option.from(userRepo.findById(id));
const displayName = maybeUser.map(u => u.displayName).unwrapOr('Anonymous');
```

### Domain Events Base

```typescript
// src/domain/shared/events/domain-event.base.ts
export abstract class DomainEvent<T = any> {
  public readonly occurredAt: Date;
  public readonly correlationId: string;
  public readonly causationId?: string;
  protected readonly _payload: T;

  constructor(payload: T, metadata?: Partial<EventMetadata>) {
    this._payload = payload;
    this.occurredAt = new Date();
    this.correlationId = metadata?.correlationId ?? generateUUID();
    this.causationId = metadata?.causationId;
  }

  get payload(): T {
    return this._payload;
  }

  get type(): string {
    return this.constructor.name;
  }

  serialize(): EventMessage {
    return {
      type: this.type,
      payload: this._payload,
      metadata: {
        occurredAt: this.occurredAt,
        correlationId: this.correlationId,
        causationId: this.causationId,
      },
    };
  }
}

export interface EventMessage {
  type: string;
  payload: any;
  metadata: {
    occurredAt: Date;
    correlationId: string;
    causationId?: string;
  };
}
```

**Implementación concreta**:
```typescript
// src/domain/auth/events/user-registered.event.ts
export class UserRegisteredEvent extends DomainEvent<{ userId: string; email: string }> {
  static create(userId: string, email: string): UserRegisteredEvent {
    return new UserRegisteredEvent(
      { userId, email },
      { correlationId: generateUUID() }
    );
  }
}
```

## Convenciones de Shared

### ¿Qué va en `src/shared/`?
- Utilidades **técnicas** (logging, plataforma, URLs)
- **Tipos de infraestructura** (Supabase, TMDB, IGDB)
- Helpers de Next.js/React

### ¿Qué va en `src/domain/shared/`?
- Conceptos **de dominio** (Value Objects bases, Eventos base, Errores de dominio)
- Utilidades **de negocio** (Result, Option, EntityId)
- Enums compartidos (MediaType, TrackingStatus)

### ¡No mezclar!
```typescript
// ❌ WRONG: Domain code imports from src/shared/logger
// ✅ CORRECT: Use ILogger interface from domain/shared, implement in infra
```

## Migración Pendiente

Archivos en `src/lib/` deben迁移 a `src/shared/` o `src/infrastructure/`:

| Archivo | Destino | Razón |
|---------|---------|-------|
| `src/lib/api-response.ts` | `src/infrastructure/http/api-response.ts` | HTTP response helper |
| `src/lib/errors/*.ts` | `src/domain/shared/errors/` (DomainError subclasses) + `src/infrastructure/http/errors/` (HttpError) | Domain vs infrastructure |
| `src/lib/supabase.ts` | `src/infrastructure/supabase/client.ts` | Supabase client |
| `src/lib/translate.ts` | `src/infrastructure/services/translation/` or keep in `src/shared/` | Translation helper (shaded) |
| `src/lib/platforms.ts` | `src/shared/platforms.ts` (ya está) | Technical utility |
| `src/lib/get-base-url.ts` | `src/shared/get-base-url.ts` (ya está) | Technical utility |

## Resumen de Convenciones

- **`src/shared/`**: Utilidades técnicas (no domain)
- **`src/types/`**: Tipos externos (Supabase, TMDB, IGDB)
- **`src/domain/shared/`**: Conceptos de dominio base (errores, VOs, eventos)
- **Nunca** importar desde `src/lib/` (legacy)

---

**Próximo**: [Development Guides](../development/overview.md) (por crear)
