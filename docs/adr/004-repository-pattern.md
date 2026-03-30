# ADR 004: Repository Pattern Implementation

**Status:** Accepted  
**Date:** 2026-03-29  
**Commit:** 957959f  

---

## Context

Necesitamos definir cómo acceder a la persistencia sin acoplar el dominio a una tecnología específica (Supabase/PostgreSQL). Seguimos el patrón Repository del DDD.

## Decision

### Uno POR AGGREGATE ROOT, no por tabla

**Anti-pattern** (previo):
```
IUserRepository → users table
ITvRepository → tv table
IMovieRepository → movies table
IGameRepository → games table
IEpisodeRepository → episodes table
```

**Problema**: Muchas tablas, muchos repos, sincronización compleja. Rompe el concepto de aggregate.

**Patrón correcto**:
```
IUserRepository → users table (User aggregate)
IMediaRepository → (tv, movies, games, episodes) inside Media aggregate
IUserMediaTrackingRepository → user_media_tracking table (UserMediaState aggregate)
IUserProfileRepository → user_profiles table (UserProfile aggregate)
IFollowRepository → follows table (Follow entity o parte de UserProfile)
```

### Definición de Puerto (Port)

El puerto (interface) se define en el **domain layer**:

```typescript
// src/domain/auth/repository/user-repository.port.ts
export interface IUserRepository {
  // Read
  findById(id: string): Promise<User | null>;
  findByEmail(email: EmailVO): Promise<User | null>;
  findByUsername(username: UsernameVO): Promise<User | null>;
  
  // Write
  save(user: User): Promise<void>;
  
  // Special queries (consulta específica, parte del contrato)
  exists(email: EmailVO, username: UsernameVO): Promise<boolean>;
  updateEmailVerification(id: string, verifiedAt: Date): Promise<void>;
}
```

**Nota**: El repository devuelve/acepta **entidades de dominio**, no DTOs.

### Implementación en Infrastructure

```typescript
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
    return User.fromDatabase(data);  // Factory method de la entidad
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
    const plain = user.toPlainObject();  // Entity → DTO de DB
    
    // Upsert por ID (si existe) o email (si es nuevo)
    const { error } = await this.supabase
      .from('users')
      .upsert(plain, { onConflict: 'email' });

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

### Entity Factory Methods: `fromDatabase` / `toPlainObject`

**Reconstrucción desde DB**:

```typescript
// En la entidad
static fromDatabase(data: any): User {
  return new User(
    new UserId(data.id),
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
```

**Serializer a objeto plano** (para DB upsert):

```typescript
toPlainObject(): {
  id: string;
  email: string;
  username: string;
  full_name: string;
  password_hash: string;
  is_verified: boolean;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
} {
  return {
    id: this._id.value,
    email: this._email.value,
    username: this._username.value,
    full_name: this._fullName.value,
    password_hash: this._passwordHash,
    is_verified: this._isVerified,
    email_verified_at: this._emailVerifiedAt?.toISOString(),
    created_at: this._createdAt.toISOString(),
    updated_at: this._updatedAt.toISOString(),
  };
}
```

**Nota**: Los nombres de campo (`full_name`) pueden diferir de las propiedades (`_fullName`). El mapper está en la entidad (near data) o en un objeto `UserMapper` aparte. Preferimos en la entidad para cohesión.

### Query Methods vs Specification Pattern

**Opción A (simple)**: Query methods en repository
```typescript
interface IUserRepository {
  findByEmail(email: EmailVO): Promise<User | null>;
  findActiveUsers(): Promise<User[]>;  // query específica
}
```

**Opción B (Specification pattern)**: Más flexible pero complejo
```typescript
interface ISpecification<T> {
  toSQL(): { where: string; params: any[] };
}

interface IRepository<T> {
  findOne(spec: ISpecification<T>): Promise<T | null>;
  findMany(spec: ISpecification<T>): Promise<T[]>;
}
```

**Decisión**: Usamos **Opción A** (query methods explícitos). Specification pattern es overkill para nuestro caso.

### Múltiples Tablas en un Aggregate (Media)

**Problema**: El aggregate `Media` contiene Tv, Movie, Game, Episode. Cada tipo está en su tabla de Supabase.

**Solución**: `IMediaRepository` maneja la complejidad de ensamblar el agregado:

```typescript
// IMediaRepository.port.ts
export interface IMediaRepository {
  // Find por ID compuesto (tmdb_123)
  findById(mediaId: MediaId): Promise<Media | null>;
  
  // Search transversal a todas las tablas
  search(query: string, type?: MediaType): Promise<PaginatedResult<Media>>;
  
  // Trending por tipo
  getTrending(type: MediaType, period: 'day' | 'week'): Promise<Media[]>;
  
  // Save (upsert) - actualiza todas las tablas necesarias en transacción
  save(media: Media): Promise<void>;
}

// Implementation
export class SupabaseMediaRepository implements IMediaRepository {
  async findById(mediaId: MediaId): Promise<Media | null> {
    // Dependiendo del tipo, llamar a la tabla correspondiente
    switch (mediaId.type) {
      case 'tmdb':
        const tv = await this.supabase.from('tv').select('*').eq('id', mediaId.id).single();
        const movie = await this.supabase.from('movies').select('*').eq('id', mediaId.id).single();
        // ... ensamblar Media aggregate
        return Media.fromExternal(tv, movie, null, null);
      case 'igdb':
        // ...
    }
  }
}
```

**Nota**: Esto puede ser complejo. Alternativa: un `MediaEntity` más ligero que no sea un aggregate contenedor, sino una abstracción polimórfica.

### Transacciones y Unit of Work

**Next.js no tiene Unit of Work nativo**. Cada repository usa su propia conexión Supabase.

Para operaciones que tocan múltiples aggregates:

```typescript
// En Application layer, comando que afecta múltiples repos
export class FollowUserCommandHandler {
  constructor(
    private readonly profileRepo: IUserProfileRepository,
    private readonly userRepo: IUserRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(cmd: FollowUserCommand): Promise<Result<void, DomainError>> {
    // Transaction manual (Supabase RPC o .rpc en DB)
    return await this.supabase.rpc('follow_user', {
      follower_id: cmd.followerId,
      following_id: cmd.followingId,
    });
    // O manejo manual con compensación si falla
  }
}
```

**Recomendación**: Usar **funciones SQL** (`rpc`) para transacciones multi-repositorio.

### Repository Testing

```typescript
// Unit test (Mock)
const userRepo = mock<IUserRepository>();
userRepo.findByEmail.resolves(User.register(...));

// Integration test (real DB)
const supabase = createClient(...);
const repo = new SupabaseUserRepository(supabase);
const user = await repo.findByEmail('test@example.com');
expect(user).toBeDefined();
```

### Repository vs DAO

- **Repository**: Lógica de negocio, devuelve entidades, operaciones del dominio
- **DAO** (Data Access Object): Solo CRUD bajo nivel, sin negocio

En Lumen, **usamos Repository** (más alto nivel). Supabase es el driver, el repo es el adaptador.

### Query Optimizations (N+1)

El repository debe ocultar problemas N+1. Si necesitas cargar hijos, el repo los carga en una sola query:

```typescript
// BAD: UI hace múltiples llamadas
const profile = await profileRepo.findById(userId);
const followers = await followRepo.getFollowers(userId);  // N+1

// GOOD: One aggregate includes children
// UserProfile ya incluye followersCount (denormalizado) o lista completa
const profile = await profileRepo.findByIdWithFollowers(userId);
```

O usar `JOIN` en Supabase query:

```typescript
async findProfileWithStats(userId: string): Promise<UserProfile> {
  const { data } = await this.supabase
    .from('user_profiles')
    .select(`
      *,
      user_media_tracking (count),
      follows:follower_id (follower_id)
    `)
    .eq('user_id', userId)
    .single();
  return UserProfile.fromDatabase(data);
}
```

---

**Próximo**: [Event-Driven Domain Events](./005-event-driven-domain-events.md)
