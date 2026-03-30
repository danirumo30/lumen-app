# ADR 003: Value Objects and Entities Design

**Status:** Accepted  
**Date:** 2026-03-29  
**Commit:** 957959f  

---

## Context

Necesitamos definir cómo estructurar Value Objects (VO) y Entities en nuestro Domain Layer, incluyendo reglas de inmutabilidad, igualdad, validación y factories.

## Decision

### Value Objects (VO)

**Características obligatorias**:
- **Inmutables**: Una vez creados, no se pueden modificar
- **Igualdad por valor**: `vo1.equals(vo2)` compara valores, no identidad
- **Validación en constructor**: Lanza `ValidationError` si datos inválidos
- **Serialización**: `toString()` y `toJSON()` consistentes

**Implementación base** (opcional):

```typescript
// src/domain/shared/value-objects/value-object.base.ts
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = value;
    this.validate();
  }

  protected abstract validate(): void;

  get value(): T {
    return this._value;
  }

  equals(other: ValueObject<T>): boolean {
    return deepEqual(this._value, other._value);
  }

  toString(): string {
    return String(this._value);
  }

  toJSON(): T {
    return this._value;
  }
}

// Ejemplo concreto
export class EmailVO extends ValueObject<string> {
  protected validate(): void {
    const email = this._value as string;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ValidationError('Invalid email format');
    }
  }

  static fromString(value: string): EmailVO {
    return new EmailVO(value.trim().toLowerCase());
  }
}
```

### Entities

**Características obligatorias**:
- **Identidad única**: Cada entidad tiene `id: EntityId` (UUID)
- **Igualdad por identidad**: `entity1.equals(entity2)` compara IDs
- **Mutabilidad controlada**: Propiedades privadas, setters con validación
- **Invariantes en constructor**: Validan consistencia
- **Métodos de dominio**: Comportamiento encapsulado

**Implementación**:

```typescript
// src/domain/shared/value-objects/entity-id.vo.ts
export abstract class EntityId<T = string> {
  private readonly _value: T;
  protected constructor(value: T) { this._value = value; }
  get value(): T { return this._value; }
  equals(other: EntityId<T>): boolean { return this._value === other._value; }
  toString(): string { return String(this._value); }
}

// Ejemplo: UserId
export class UserId extends EntityId<string> {
  constructor(id: string) {
    super(id);
    if (!isUUIDV4(id)) throw new ValidationError('Invalid UserId');
  }
  static generate(): UserId {
    return new UserId(uuidV4());
  }
}

// src/domain/auth/entities/user.entity.ts
export class User {
  private readonly _id: UserId;
  private _email: EmailVO;
  private _username: UsernameVO;
  private _fullName: FullNameVO;
  private _passwordHash: string;
  private _isVerified: boolean;
  private _emailVerifiedAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: UserId,
    email: EmailVO,
    username: UsernameVO,
    fullName: FullNameVO,
    passwordHash: string,
    isVerified: boolean,
    emailVerifiedAt?: Date
  ) {
    this._id = id;
    this._email = email;
    this._username = username;
    this._fullName = fullName;
    this._passwordHash = passwordHash;
    this._isVerified = isVerified;
    this._emailVerifiedAt = emailVerifiedAt;
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this.validateInvariants();
  }

  // Factory methods
  static register(email: EmailVO, username: UsernameVO, fullName: FullNameVO, passwordHash: string): User {
    const id = UserId.generate();
    return new User(id, email, username, fullName, passwordHash, false);
  }

  static fromDatabase(data: any): User {
    return new User(
      new UserId(data.id),
      new EmailVO(data.email),
      new UsernameVO(data.username),
      new FullNameVO(data.full_name),
      data.password_hash,
      data.is_verified,
      data.email_verified_at ? new Date(data.email_verified_at) : undefined
    );
  }

  // Business methods
  verifyEmail(): void {
    if (this._isVerified) throw new ConflictError('Email already verified');
    this._isVerified = true;
    this._emailVerifiedAt = new Date();
    this._updatedAt = new Date();
    this.validateInvariants();
  }

  changeEmail(newEmail: EmailVO): void {
    if (this._email.equals(newEmail)) return;
    this._email = newEmail;
    this._isVerified = false;  // Re-verification required
    this._emailVerifiedAt = undefined;
    this._updatedAt = new Date();
  }

  // Validation invariants
  private validateInvariants(): void {
    // Ejemplo: email y username deben ser únicos (delegado a repo)
    // pero invariante local: si está verificado, emailVerifiedAt debe existir
    if (this._isVerified && !this._emailVerifiedAt) {
      throw new InvalidUserError('Verified user must have email_verified_at');
    }
  }

  // Getters (sin setters públicos)
  get id(): UserId { return this._id; }
  get email(): EmailVO { return this._email; }
  get username(): UsernameVO { return this._username; }
  get isVerified(): boolean { return this._isVerified; }
  // ...
}
```

## Aggregates y Boundaries

**Aggregate Root**: Entidad principal que controla acceso a sus hijos.

Ejemplo: `Media` aggregate (contexto Media):

```typescript
// src/domain/media/entities/media.entity.ts
export class Media {
  private _tv: Map<string, Tv> = new Map();
  private _movies: Map<string, Movie> = new Map();
  private _games: Map<string, Game> = new Map();
  private _episodes: Map<string, Episode> = new Map();  // episodes keyed by tvId+episodeNum

  private constructor(
    private readonly _mediaId: MediaId,
    private _title: string,
    private _overview: string,
    // ... other common fields
  ) {}

  // Factory desde API externa
  static fromTmdbMovie(dto: TmdbMovieDto): Media {
    const media = new Media(
      new MediaId(`tmdb_${dto.id}`),
      dto.title,
      dto.overview,
      // ...
    );
    media.addMovie(Movie.fromTmdb(dto));
    return media;
  }

  // Métodos de agregación (solo el root puede modificar hijos)
  addMovie(movie: Movie): void {
    if (movie.mediaId.type !== 'tmdb') throw new InvalidMediaError('Expected TMDB ID');
    this._movies.set(movie.id.toString(), movie);
  }

  addTv(tv: Tv): void {
    this._tv.set(tv.id.toString(), tv);
    // Auto-add episodes
    tv.episodes.forEach(ep => this._episodes.set(ep.id.toString(), ep));
  }

  // Queries (solo lectura)
  findTv(id: string): Tv | undefined {
    return this._tv.get(id);
  }

  findMovie(id: string): Movie | undefined {
    return this._movies.get(id);
  }

  findEpisode(tvId: string, season: number, episode: number): Episode | undefined {
    const key = `${tvId}_s${season}e${episode}`;
    return this._episodes.get(key);
  }

  // Invariantes a nivel de agregado
  validate(): void {
    // Ej: no puede haber dos Tv con mismo ID
    const tvIds = Array.from(this._tv.values()).map(t => t.id.toString());
    if (new Set(tvIds).size !== tvIds.length) {
      throw new InvalidMediaError('Duplicate TV IDs within aggregate');
    }
  }
}
```

## Factory vs Constructor

- **Constructor privado**: Fuerza uso de factories, valida invariantes
- **Factory estático**: `Entity.fromDatabase(data)` para reconstrucción
- **Factory de creación**: `Entity.createNew(params)` para nuevos objetos

```typescript
// New entity
const user = User.register(email, username, passwordHash);

// From DB
const user = User.fromDatabase(dbRow);

// Clone with modifications
const updated = user.withEmail(newEmail); // returns new instance (immutabilidad)
```

## Inmutabilidad vs Mutabilidad

**VO**: Siempre inmutables (sin setters).

**Entity**: Mutables pero controlados:
- Propiedades privadas
- Setters que ejecutan validación
- Alternativa: fully immutable with `withX()` methods (más funcional)

```typescript
// Inmutable style (optional)
withEmail(email: EmailVO): User {
  const copy = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
  copy._email = email;
  copy._updatedAt = new Date();
  copy.validateInvariants();
  return copy;
}
```

## Value Objects Reutilizables

**Shared VOs** (en `src/domain/shared/value-objects/`):

- `EntityId` – base para IDs
- `EmailVO` – usado en Auth y posiblemente Social
- `MediaId` – usado en Media context y UserMediaState
- `UsernameVO` – usado en Auth y Social

**Context-specific VOs** (en el contexto correspondiente):

- `TrackingStatus` (Media)
- `UserStatsVO` (Social)
- `BioVO` (Social)

## Testing Value Objects y Entities

```typescript
describe('EmailVO', () => {
  it('should accept valid email', () => {
    const email = new EmailVO('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('should normalize to lowercase', () => {
    const email = new EmailVO('Test@Example.COM');
    expect(email.value).toBe('test@example.com');
  });

  it('should reject invalid email', () => {
    expect(() => new EmailVO('invalid')).toThrow(ValidationError);
  });

  it('should compare by value', () => {
    const e1 = new EmailVO('test@example.com');
    const e2 = new EmailVO('test@example.com');
    expect(e1.equals(e2)).toBe(true);
  });
});

describe('User Entity', () => {
  it('should register new user', () => {
    const user = User.register(
      new EmailVO('test@example.com'),
      new UsernameVO('john'),
      new FullNameVO('John Doe'),
      'hashed_password'
    );
    expect(user.isVerified).toBe(false);
    expect(user.id).toBeInstanceOf(UserId);
  });

  it('should enforce invariants', () => {
    // Should throw if business rule violated
  });

  it('should allow email verification', () => {
    user.verifyEmail();
    expect(user.isVerified).toBe(true);
    expect(user.emailVerifiedAt).toBeDefined();
  });
});
```

---

**Próximo**: [Repository Pattern](./004-repository-pattern.md)
