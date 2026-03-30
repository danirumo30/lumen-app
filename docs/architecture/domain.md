# Domain Layer - Guía Detallada

## Estructura de Dominio

```
src/domain/
├── auth/
│   ├── entities/
│   │   ├── user.entity.ts           # Aggregate Root: User
│   │   └── (UserMediaState)         # Se mueve a media (seguimiento)
│   ├── value_objects/
│   │   ├── email.vo.ts              # Normalizado, validado
│   │   ├── username.vo.ts           # 3-30 chars, alfanumérico+
│   │   ├── fullname.vo.ts           # Trim, 1-100 chars
│   │   └── password.vo.ts           # Hash nunca en claro
│   ├── events/
│   │   ├── user-registered.event.ts
│   │   ├── email-verified.event.ts
│   │   └── password-reset.event.ts
│   ├── repository/
│   │   └── user-repository.port.ts  # IUserRepository
│   ├── services/
│   │   ├── auth.service.ts          # Lógica de autenticación
│   │   ├── token.service.ts         # JWT generación/revocación
│   │   └── verification.service.ts  # Email verification flow
│   └── index.ts
├── media/
│   ├── entities/
│   │   ├── media.entity.ts          # Aggregate Root: Media (contiene Tv, Movie, Game, Episode)
│   │   ├── tv.entity.ts             # Entidad hija (dentro de Media)
│   │   ├── movie.entity.ts          # Entidad hija
│   │   ├── game.entity.ts           # Entidad hija
│   │   ├── episode.entity.ts        # Entidad hija
│   │   └── user-media-state.entity.ts  # Aggregate Root? o parte de User?
│   ├── value_objects/
│   │   ├── media-id.vo.ts           # Wrap: tmdb_123, igdb_456
│   │   ├── media-type.enum.ts       # MOVIE, TV, GAME, EPISODE
│   │   ├── tracking-status.enum.ts  # WATCHED, FAVORITE, PLANNED
│   │   ├── episode-number.vo.ts     # Temporada + número
│   │   └── runtime.vo.ts            # Minutos, validación > 0
│   ├── events/
│   │   ├── media-toggled.event.ts
│   │   ├── media-status-updated.event.ts
│   │   └── media-discovered.event.ts
│   ├── repository/
│   │   ├── media-repository.port.ts        # IMediaRepository
│   │   ├── user-media-repository.port.ts   # IUserMediaTrackingRepository
│   │   ├── tv-repository.port.ts (deprecated?) → dentro de MediaRepository
│   │   └── movie-repository.port.ts (deprecated?) → dentro de MediaRepository
│   ├── services/
│   │   ├── media-matcher.service.ts        # Empareja tracking con TMDB/IGDB
│   │   ├── episode-matcher.service.ts      # Lógica de episodios
│   │   └── trending-calculator.service.ts  # Calcula tendencias
│   └── index.ts
├── social/
│   ├── entities/
│   │   ├── user-profile.entity.ts   # Aggregate Root: UserProfile (independiente de User)
│   │   └── follow.entity.ts         # Entity o parte de UserProfile? (decisión: separado)
│   ├── value_objects/
│   │   ├── username-vo.ts           # Reutilizable? (igual que auth/username)
│   │   ├── bio.vo.ts                # Max 500 chars
│   │   ├── user-stats.vo.ts         # StatsValueObject
│   │   └── privacy-settings.vo.ts
│   ├── events/
│   │   ├── profile-updated.event.ts
│   │   ├── user-followed.event.ts
│   │   └── user-unfollowed.event.ts
│   ├── repository/
│   │   ├── user-profile-repository.port.ts  # IUserProfileRepository
│   │   └── follow-repository.port.ts        # IFollowRepository
│   ├── services/
│   │   ├── follow.service.ts        # Lógica de follow/unfollow
│   │   ├── stats.service.ts         # Cálculo de estadísticas sociales
│   │   └── profile-search.service.ts
│   └── index.ts
└── shared/
    ├── errors/
    │   ├── domain-error.ts          # Base class
    │   ├── invalid-entity-error.ts
    │   ├── validation-error.ts
    │   ├── not-found-error.ts
    │   ├── conflict-error.ts
    │   ├── permission-denied-error.ts
    │   └── index.ts
    ├── value-objects/
    │   ├── entity-id.vo.ts          # Base para IDs de aggregates
    │   ├── result.ts                 # Result<T> (success/error pattern)
    │   ├── option.ts                 # Option<T> (nullable seguro)
    │   ├── email.vo.ts (shared?)     # ¿Mover de auth a shared?
    │   ├── media-id.vo.ts (shared?)  # ¿Mover de media a shared?
    │   └── index.ts
    ├── events/
    │   ├── domain-event.base.ts     # Abstract DomainEvent
    │   ├── event-metadata.vo.ts      # Timestamp, correlationId, causationId
    │   ├── event-bus.port.ts         # IEventBus (para eventos cross-context)
    │   ├── event-subscriber.port.ts  # IEventSubscriber
    │   └── index.ts
    ├── models/
    │   ├── enums.ts
    │   ├── pagination.dto.ts
    │   └── index.ts
    └── index.ts
```

## Bounded Contexts Definidos

### 1. Contexto de Autenticación (Auth)

**Responsabilidad**: Gestionar identidad, autenticación, autorización y verificación de email.

**Agregados**:
- `User` (Aggregate Root)
  - Identidad única: `email`, `username`
  - Atributos: `email`, `username`, `fullName`, `avatarUrl`, `isVerified`, `isActive`, `emailVerifiedAt`
  - Hijos:
    - `UserMediaState` (NO – es parte del contexto Media)
    - `UserSettings` (opcional, pendiente)
  - Invariantes:
    - Email único (en DB + dominio)
    - Username único
    - Solo un usuario por email/username

**Value Objects**:
- `EmailVO` – normaliza a lowercase, validación regex RFC 5322
- `UsernameVO` – 3-30 chars, alfanumérico + guiones, sin espacios
- `FullNameVO` – trim, 1-100 chars
- `PasswordVO` – hash (argon2/bcrypt), never plain text

**Domain Events**:
- `UserRegisteredEvent` – cuando se crea usuario (trigger: crear perfil social)
- `EmailVerifiedEvent` – cuando se confirma email (trigger: actualizar auth flags)
- `PasswordResetRequestedEvent` – para envio de email
- `PasswordResetCompletedEvent` – para auditoría

**Repositorios (Ports)**:
- `IUserRepository` – CRUD de User, búsqueda por email/username
- Métodos: `findById`, `findByEmail`, `findByUsername`, `save`, `exists`

**Domain Services**:
- `AuthService` – lógica de login, registro, logout
- `TokenService` – generación/validación/revocación de JWTs
- `VerificationService` – flujo de verificación de email

### 2. Contexto de Medios (Media)

**Responsabilidad**: Gestionar catálogo de contenido (TV, películas, juegos, episodios) y su seguimiento por usuarios.

**Agregados**:

#### `Media` (Aggregate Root) – Contenedor de contenido

**Nota**: Diseño discutido en ADR 001. En lugar de múltiples aggregates (Tv, Movie, Game), usamos un único root `Media` que contiene distintas entidades hijas.

```typescript
class Media {
  private _tv: Tv[];
  private _movies: Movie[];
  private _games: Game[];
  private _episodes: Episode[];

  // Métodos de fábrica desde APIs externas
  static fromTmdb(tmdbData: TmdbMovieDto): Media { ... }
  static fromIgdb(igdbData: IgdbGameDto): Media { ... }

  // Métodos de consulta
  findTvById(tvId: string): Tv | undefined
  findMovieById(movieId: string): Movie | undefined
  findGameById(gameId: string): Game | undefined

  // Agregar contenido
  addTv(tv: Tv): void
  addMovie(movie: Movie): void
  addGame(game: Game): void
  addEpisode(episode: Episode): void
}
```

**Entidades Hijas**:

- `Tv` (Entity)
  - `tvId`: MediaId (unique within TV type)
  - `title`, `overview`, `posterPath`, `backdropPath`, `firstAirDate`, `lastAirDate`, `status`, `genres`, `rating`
  - Relación: `episodes: Episode[]`

- `Movie` (Entity)
  - `movieId`: MediaId
  - `title`, `overview`, `releaseDate`, `runtime`, `genres`, `rating`

- `Game` (Entity)
  - `gameId`: MediaId
  - `name`, `summary`, `firstReleaseDate`, `genres`, `rating`, `dlcs?: Game[]`

- `Episode` (Entity)
  - `episodeId`: unique
  - `tvId: MediaId` (padre)
  - `seasonNumber`, `episodeNumber`, `title`, `airDate`, `runtime`

**Value Objects**:
- `MediaId` – wrapper sobre string, formateado: `tmdb_{id}` o `igdb_{id}`
- `MediaType` – enum: `'MOVIE' | 'TV' | 'GAME' | 'EPISODE'`
- `EpisodeNumber` – combinación `season` + `episode`
- `Runtime` – minutos, > 0

**Domain Events**:
- `MediaDiscoveredEvent` – cuando se añade nuevo contenido al catálogo
- `MediaToggledEvent` – usuario cambia estado (watch/favorite)
- `MediaStatusUpdatedEvent` – usuario actualiza progreso/rating

**Repositorios**:
- `IMediaRepository` – operaciones sobre catalog
  - `findById(mediaId): Media`
  - `search(query, type?, page?): PaginatedResult<Media>`
  - `getTrending(type?, period?): Media[]`
  - `save(media: Media)`
- `IUserMediaTrackingRepository` – seguimiento de usuario
  - `findByUser(userId): UserMediaState[]`
  - `findByUserAndMedia(userId, mediaId): UserMediaState | null`
  - `save(state: UserMediaState)`
  - `delete(userId, mediaId)`

⚠️ **Decisiones Pendientes**:
- ¿`UserMediaState` es aggregate root separado o parte de `User`?
  - Si está en Media context → es root propio, repo `IUserMediaTrackingRepository`
  - Si está en Auth context → forma parte de `User` aggregate
  - **Decisión actual**: Separado, en Media context (razón: reusabilidad cross-auth/social)

#### Servicios de Dominio Media

- `MediaMatcherService` – matching entre tracking user y Media IDs (TMDB/IGDB search)
- `EpisodeMatcherService` – lógica para parsear "S01E05" → `EpisodeNumber(1,5)`
- `TrendingCalculatorService` – algoritmo de trending (score = popularity × rating × days)

### 3. Contexto Social (Social)

**Responsabilidad**: Gestionar perfiles públicos, seguidores, estadísticas sociales.

**Agregados**:

#### `UserProfile` (Aggregate Root)

**Nota**: Aunque `User` está en Auth context, `UserProfile` es **separado** (Social context). Relación: `User.id` → `UserProfile.userId`.

```typescript
class UserProfile {
  private _userId: string;
  private _username: UsernameVO;
  private _avatarUrl?: string;
  private _bio?: BioVO;
  private _isPublic: boolean;
  private _stats: UserStatsVO;  // Calculated, puede ser denormalizado
  private _followers: string[];  // IDs de usuarios (colección value)
  private _following: string[];  // IDs de usuarios

  // Business rules
  setPrivacy(public: boolean): void
  updateProfile(avatarUrl?, bio?): void
  canView(otherUserId: string): boolean  // Privacy check
}
```

**Value Objects**:
- `UsernameVO` – igual que en Auth (reutilizar o duplicar? Mejor shared)
- `BioVO` – trim, max 500 chars
- `UserStatsVO` – `{ totalMovies: number, totalSeries: number, totalGames: number, followersCount, followingCount }`
- `PrivacySettingsVO` – booleans: `isProfilePublic`, `showMediaPublic`

**Domain Events**:
- `ProfileUpdatedEvent` – cambios en bio/avatar
- `UserFollowedEvent` – aumento followers +1
- `UserUnfollowedEvent` – decremento followers -1

**Repositorios**:
- `IUserProfileRepository` – CRUD de perfil
  - `findByUserId(userId): UserProfile | null`
  - `findByUsername(username): UserProfile | null`
  - `save(profile: UserProfile)`
  - `exists(username): boolean`
- `IFollowRepository` – gestión de follows (si es entidad separada)
  - `follow(followerId, followingId)`
  - `unfollow(followerId, followingId)`
  - `getFollowers(userId): string[]`
  - `getFollowing(userId): string[]`

**Servicios**:
- `FollowService` – orquesta follow/unfollow + eventos
- `ProfileSearchService` – búsqueda por username/bio
- `StatsService` – cálculo/actualización de estadísticas

### 4. Contexto Compartido (Shared)

**Responsabilidad**: Componentes reutilizables en todos los contexts.

**Value Objects Base**:
- `EntityId` – clase base para IDs únicos (uuid random o string)
- `Result<T>` – discriminated union: `{ ok: true, value: T } | { ok: false, error: DomainError }`
- `Option<T>` – `{ some: T } | { none: null }`
- `EmailVO` (compartido entre auth y otros)
- `MediaIdVO` (compartido entre media y otros)

**Errores de Dominio** (`src/domain/shared/errors/`):
```typescript
class DomainError extends Error {
  code: string;
  details?: Record<string, any>;
}

class ValidationError extends DomainError { ... }
class NotFoundError extends DomainError { ... }
class ConflictError extends DomainError { ... }  // e.g. email already exists
class PermissionDeniedError extends DomainError { ... }
class InvalidUserMediaStateError extends DomainError { ... }
```

**Eventos Base** (`src/domain/shared/events/`):
```typescript
abstract class DomainEvent<T = any> {
  readonly occurredAt: Date;
  readonly correlationId: string;  // Trace across contexts
  readonly causationId?: string;   // Event that caused this
  readonly payload: T;

  serialize(): EventMessage { ... }
}

interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
}

interface IEventSubscriber<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}
```

## Value Objects Profundos

### EmailVO
```typescript
class EmailVO {
  private readonly _value: string;

  constructor(value: string) {
    const normalized = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new ValidationError('Invalid email format');
    }
    this._value = normalized;
  }

  get value(): string { return this._value; }
  equals(other: EmailVO): boolean { return this._value === other._value; }
  toString(): string { return this._value; }
}
```

### UsernameVO
```typescript
class UsernameVO {
  private readonly _value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > 30) {
      throw new ValidationError('Username must be 3-30 chars');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      throw new ValidationError('Only alphanumeric, dash, underscore allowed');
    }
    this._value = trimmed;
  }

  // Métodos de dominio
  get value(): string { return this._value }
  toString(): string { return this._value }
}
```

### MediaIdVO
```typescript
class MediaId {
  private readonly _type: 'tmdb' | 'igdb';
  private readonly _id: string;

  static fromString(value: string): MediaId {
    const [type, id] = value.split('_');
    if (type !== 'tmdb' && type !== 'igdb') {
      throw new ValidationError('Invalid MediaId prefix');
    }
    if (!id) throw new ValidationError('MediaId missing numeric part');
    return new MediaId(type, id);
  }

  get type(): 'tmdb' | 'igdb' { return this._type; }
  get id(): string { return this._id; }
  toString(): string { return `${this._type}_${this._id}`; }
  equals(other: MediaId): boolean {
    return this._type === other._type && this._id === other._id;
  }
}
```

## Reglas de Invariante

Cada aggregate es responsable de validar sus propias reglas de negocio en el constructor y en cada mutación:

```typescript
// Ejemplo UserMediaState
private validateInvariants(): void {
  // Solo un flag de estado a la vez
  const activeFlags = [this._isFavorite, this._isWatched, this._isPlanned].filter(Boolean);
  if (activeFlags.length > 1) {
    throw new InvalidUserMediaStateError('Only one status flag can be active');
  }

  // Platinum requiere estar visto
  if (this._hasPlatinum && !this._isWatched) {
    throw new InvalidUserMediaStateError('Cannot have platinum without being watched');
  }
}
```

---

**Próximo**: [Application Layer](./application.md)
