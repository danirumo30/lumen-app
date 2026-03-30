# Infrastructure Layer - Guía Detallada

## Propósito

La capa de infraestructura contiene **adaptadores** que implementan interfaces (ports) definidas en el domain layer. Es la capa más externa, en contacto con:

- Bases de datos (Supabase/PostgreSQL)
- APIs externas (TMDB, IGDB)
- Servicios de email (Nodemailer, SendGrid)
- Framework (Next.js API Routes, React)
- Cache (React Query)

## Principios

1. **Implementa puertos (ports)**: `IUserRepository` → `SupabaseUserRepository`
2. **Sin lógica de negocio**: solo mapeo, transformación, llamadas externas
3. **Código desechable**: fácil reemplazar Supabase por otro backend cambando 1 clase
4. **Mappers aislados**: transforman DTOs externos a modelos de dominio

## Estructura General

```
src/infrastructure/
├── persistence/
│   └── supabase/
│       ├── auth/
│       │   ├── supabase-auth.repository.ts   # IUserRepository impl
│       │   ├── email/
│       │   │   ├── supabase-email.service.ts  # Token + DB ops
│       │   │   └── nodemailer.adapter.ts      # IEmailService impl
│       │   └── index.ts
│       ├── media/
│       │   ├── supabase-media.repository.ts         # IMediaRepository
│       │   ├── supabase-episode.repository.ts       # IEpsiodeRepository?
│       │   ├── supabase-user-media.repository.ts    # IUserMediaTrackingRepo
│       │   └── index.ts
│       ├── social/
│       │   ├── supabase-profile.repository.ts       # IUserProfileRepository
│       │   ├── supabase-follow.repository.ts        # IFollowRepository
│       │   └── index.ts
│       └── index.ts
├── external/
│   ├── tmdb/
│   │   ├── tmdb.client.ts        # ITmdbClient implementation
│   │   ├── tmdb.mapper.ts        # TmdbMovieDto → MediaEntity
│   │   └── index.ts
│   ├── igdb/
│   │   ├── igdb.client.ts        # IIgdbClient implementation
│   │   ├── igdb.mapper.ts        # IgdbGameDto → MediaEntity
│   │   └── index.ts
│   └── index.ts
├── services/
│   ├── email/
│   │   ├── email.service.ts      # Interface EmailService
│   │   ├── nodemailer.adapter.ts
│   │   ├── sendgrid.adapter.ts
│   │   └── index.ts
│   ├── translation/
│   │   └── translation.service.ts
│   └── index.ts
├── http/
│   ├── middleware/
│   │   ├── auth.middleware.ts    # Verifica JWT, setea context
│   │   ├── rate-limit.middleware.ts
│   │   ├── error.middleware.ts   # Global error formatter
│   │   └── validation.middleware.ts
│   ├── api-response.ts           # Helper Response.json({ data, error, meta })
│   ├── errors/
│   │   ├── http-exception.ts
│   │   ├── error-mapper.ts      # DomainError → HTTP status
│   │   └── index.ts
│   └── index.ts
├── react-query/
│   ├── query-client.tsx         # React Query client config (staleTime, cacheTime)
│   ├── hooks/
│   │   ├── use-auth.hook.ts     # useAuth(), useUser()
│   │   ├── use-profile.hook.ts  # useProfile(username)
│   │   ├── use-media.hook.ts    # useMedia(mediaId), useUserMedia(userId)
│   │   └── index.ts
│   └── index.ts
├── contexts/
│   └── auth-context.tsx         # AuthContext (legacy, deprecate hacia hooks)
├── hooks/
│   ├── use-episode-toggle.ts    # Custom hook para toggles de episodios
│   ├── use-batch-episode-toggle.ts
│   ├── use-watched-episodes.ts
│   └── index.ts
├── supabase/
│   └── client.ts                # Supabase singleton client
└── index.ts
```

## Adaptadores de Persistencia (Supabase)

### Patrón Repository

```typescript
// Domain Port
// src/domain/auth/repository/user-repository.port.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: EmailVO): Promise<User | null>;
  findByUsername(username: UsernameVO): Promise<User | null>;
  save(user: User): Promise<void>;
  exists(email: EmailVO, username: UsernameVO): Promise<boolean>;
  updateEmailVerification(id: string, verifiedAt: Date): Promise<void>;
}

// Implementation
// src/infrastructure/persistence/supabase/auth/supabase-auth.repository.ts
export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return User.fromDatabase(data);  // Entity factory method
  }

  async findByEmail(email: EmailVO): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email.value)
      .single();

    if (error || !data) return null;
    return User.fromDatabase(data);
  }

  async save(user: User): Promise<void> {
    const plain = user.toPlainObject();  // Entity → DTO
    const { error } = await this.supabase
      .from('users')
      .upsert(plain);  // upsert por id o email unique

    if (error) {
      throw new PersistenceError('Failed to save user', error);
    }
  }

  async exists(email: EmailVO, username: UsernameVO): Promise<boolean> {
    const { count, error } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .or(`email.eq.${email.value},username.eq.${username.value}`);

    return !error && count > 0;
  }
}
```

### Entity Factory Methods

```typescript
// src/domain/auth/entities/user.entity.ts
export class User {
  private constructor(
    private readonly _id: string,
    private readonly _email: EmailVO,
    private readonly _username: UsernameVO,
    private readonly _fullName: FullNameVO,
    private readonly _passwordHash: string,
    private readonly _isVerified: boolean,
    private readonly _emailVerifiedAt?: Date,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  // Factory desde DB
  static fromDatabase(data: any): User {
    return new User(
      data.id,
      new EmailVO(data.email),
      new UsernameVO(data.username),
      new FullNameVO(data.full_name),
      data.password_hash,
      data.is_verified,
      data.email_verified_at ? new Date(data.email_verified_at) : undefined,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  // Factory para nuevo registro
  static register(
    email: EmailVO,
    username: UsernameVO,
    fullName: FullNameVO,
    passwordHash: string
  ): User {
    const now = new Date();
    return new User(
      generateUUID(),
      email,
      username,
      fullName,
      passwordHash,
      false,  // isVerified
      undefined,
      now,
      now
    );
  }

  toPlainObject(): UserDto {
    return {
      id: this._id,
      email: this._email.value,
      username: this._username.value,
      fullName: this._fullName.value,
      isVerified: this._isVerified,
      emailVerifiedAt: this._emailVerifiedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
```

## Adaptadores de APIs Externas

### TMDB Client

```typescript
// src/infrastructure/external/tmdb/tmdb.client.ts
export class TmdbClient implements ITmdbClient {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY!;
    if (!this.apiKey) throw new ConfigurationError('TMDB_API_KEY missing');
  }

  async getMovie(id: string): Promise<TmdbMovieDto> {
    const url = `${this.baseUrl}/movie/${id}?api_key=${this.apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new ExternalServiceError('TMDB', response.statusText);
    }
    return response.json();
  }

  async search(query: string, type?: MediaType): Promise<TmdbSearchResult[]> {
    // ...
  }

  async getTrending(period: 'day' | 'week'): Promise<TmdbMovieDto[]> {
    // ...
  }
}
```

### Mapper TMDB → Domain

```typescript
// src/infrastructure/external/tmdb/tmdb.mapper.ts
export class TmdbMapper {
  static movieToMedia(dto: TmdbMovieDto): Media {
    const mediaId = new MediaId(`tmdb_${dto.id}`);
    return new Media(
      // Constructores privados, usar factory
      mediaId,
      dto.title,
      dto.overview,
      dto.poster_path,
      new Date(dto.release_date),
      dto.runtime,
      dto.genres.map(g => g.name),
      dto.vote_average,
      'MOVIE'
    );
  }

  static tvToMedia(dto: TmdbTvDto): Media {
    // Similar
  }
}
```

## Servicios de Email

### Interface

```typescript
// src/infrastructure/services/email/email.service.ts
export interface IEmailService {
  sendMail(to: string, subject: string, html: string): Promise<void>;
  sendVerificationEmail(to: string, token: string): Promise<void>;
  sendPasswordResetEmail(to: string, token: string): Promise<void>;
}
```

### Nodemailer Adapter

```typescript
// src/infrastructure/services/email/nodemailer.adapter.ts
export class NodemailerEmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    await this.transporter.sendMail({
      from: `"Lumen" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${process.env.APP_URL}/api/auth/confirm-email?token=${token}`;
    const html = `<p>Click <a href="${link}">here</a> to verify your email</p>`;
    await this.sendMail(to, 'Verify your email', html);
  }
}
```

### SendGrid Adapter (producción)

```typescript
// src/infrastructure/services/email/sendgrid.adapter.ts
import { SendGridEmailService } from 'src/infrastructure/services/email/sendgrid.adapter';

// Similar, usando @sendgrid/mail
```

## React Query y Hooks

### Query Client Config

```typescript
// src/infrastructure/react-query/query-client.tsx
'use client';

import { QueryClient, HydrationBoundary } from '@tanstack/react-query';

const isDev = process.env.NODE_ENV === 'development';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutos
      gcTime: 1000 * 60 * 30,   // 30 minutos (antes: cacheTime)
      retry: 1,                 // Reintentos en fallo
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
  logger: isDev ? { log: console.log, warn: console.warn, error: console.error } : undefined,
});
```

### Custom Hooks

```typescript
// src/infrastructure/react-query/hooks/use-auth.hook.ts
export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => fetchCurrentUser(),
    staleTime: 1000 * 60 * 10,
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginDto) => loginCommand.execute(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'current'], data.user);
      // Invalidar otras queries
      queryClient.invalidateQueries({ queryKey: ['profile', data.user.username] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => logoutCommand.execute(),
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
```

### Hooks de Infraestructura No-Query

```typescript
// src/infrastructure/hooks/use-episode-toggle.ts
export function useEpisodeToggle() {
  const queryClient = useQueryClient();

  return async (params: EpisodeToggleParams) => {
    const result = await toggleEpisodeCommand.execute(params);

    if (result.success) {
      // Invalidar cache de user media
      queryClient.invalidateQueries({
        queryKey: ['userMedia', params.userId],
      });
      // Invalidar media state específico
      queryClient.invalidateQueries({
        queryKey: ['mediaState', params.userId, params.episodeId],
      });
    }

    return result;
  };
}
```

## HTTP Middleware

### Auth Middleware

```typescript
// src/infrastructure/http/middleware/auth.middleware.ts
export async function authMiddleware(
  request: Request,
  env: Env
): Promise<Response | void> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new UnauthorizedError('Missing token');
  }

  try {
    const user = await verifyJwt(token, env.JWT_SECRET);
    // Attach user to request context
    (request as any).user = user;
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
}
```

### Validation Middleware

```typescript
// src/infrastructure/http/middleware/validation.middleware.ts
export function validateDto<T>(schema: ZodSchema<T>) {
  return async (request: Request): Promise<T> => {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(result.error.flatten().fieldErrors);
    }
    return result.data;
  };
}

// Uso en API route:
export async function POST(request: Request) {
  const dto = await validateDto(LoginDto)(request);
  const result = await loginCommand.execute(dto);
  return Response.json(result);
}
```

## Error Mappers

```typescript
// src/infrastructure/http/errors/error-mapper.ts
export class ErrorMapper {
  static toHttpStatus(error: DomainError): number {
    if (error instanceof ValidationError) return 400;
    if (error instanceof NotFoundError) return 404;
    if (error instanceof ConflictError) return 409;
    if (error instanceof PermissionDeniedError) return 403;
    if (error instanceof AuthenticationError) return 401;
    return 500;
  }

  static toApiResponse(error: DomainError): ApiError {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }
}
```

## Configuración de Supabase

```typescript
// src/infrastructure/supabase/client.ts
import { createClient } from '@supabase/ssr';

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,  // Next.js SSR maneja cookies manual
        autoRefreshToken: false,
      },
    }
  );

  return supabase;
}

// Server-side (API Routes)
export function createClient(req: Request): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => getCookie(name, req),
        set: (name, value, options) => setCookie(name, value, options, req),
      },
    }
  );
}
```

## Migración de `src/lib/` → Infrastructure

Archivos legacy en `src/lib/` que deben迁入:

| Archivo origen | Destino infrastructure | Razón |
|----------------|------------------------|-------|
| `src/lib/api-response.ts` | `src/infrastructure/http/api-response.ts` | HTTP concern |
| `src/lib/errors/*.ts` | `src/infrastructure/http/errors/` y `src/domain/shared/errors/` | Domain vs HTTP split |
| `src/lib/supabase.ts` | `src/infrastructure/persistence/supabase/client.ts` | Persistence |
| `src/lib/translate.ts` | `src/infrastructure/services/translation/` | External service |
| `src/lib/platforms.ts` | `src/infrastructure/mappers/platform.mapper.ts` | Mapper |

---

**Próximo**: [Shared Utilities](./shared.md)
