# Application Layer - Guía Detallada

## Propósito

La capa de aplicación coordina casos de uso, orquesta operaciones y define contratos (DTOs, ports). **No contiene lógica de negocio** – solo orquestación de dominios y adaptadores.

## Principios

1. **No contiene reglas de negocio**: delega al domain layer
2. **Orquestación thin**: un comando llama a 1+ repositorios/domain services, publica eventos
3. **DTOs como contratos**: inputs validados, outputs tipados
4. **Ports definidos aquí o en domain**: dependencias inversas

## Estructura por Contexto

```
src/application/
├── auth/
│   ├── commands/
│   │   ├── login.command.ts
│   │   ├── logout.command.ts
│   │   ├── register.command.ts
│   │   ├── request-password-reset.command.ts
│   │   ├── reset-password.command.ts
│   │   ├── request-verification.command.ts
│   │   ├── confirm-email.command.ts
│   │   └── simulate-verification.command.ts (dev only)
│   ├── queries/
│   │   ├── get-current-user.query.ts
│   │   ├── get-profile.query.ts
│   │   └── get-user-stats.query.ts
│   ├── dto/
│   │   ├── auth.dto.ts          # LoginDto, RegisterDto, UserDto
│   │   └── verification.dto.ts  # VerifyEmailDto
│   ├── ports/
│   │   ├── i-email.service.ts   # Interface EmailService
│   │   ├── i-token.service.ts   # Interface TokenService
│   │   ├── i-auth.repository.ts # Interface IUserRepository (domain repo)
│   │   └── i-crypto.service.ts  # Interface para hash/verify
│   └── index.ts
├── media/
│   ├── commands/
│   │   ├── mark-as-watched.command.ts
│   │   ├── mark-as-unwatched.command.ts
│   │   ├── toggle-favorite.command.ts
│   │   ├── set-media-rating.command.ts
│   │   ├── set-progress.command.ts
│   │   ├── toggle-platinum.command.ts
│   │   └── save-media-state.command.ts (orchestrator)
│   ├── queries/
│   │   ├── get-media-state.query.ts
│   │   ├── get-user-media.query.ts
│   │   ├── get-user-stats.query.ts
│   │   ├── get-trending-media.query.ts
│   │   └── search-media.query.ts
│   ├── dto/
│   │   ├── media.dto.ts         # MediaDto, TvDto, MovieDto, GameDto, EpisodeDto
│   │   ├── user-media-state.dto.ts
│   │   └── media-statistics.dto.ts
│   ├── ports/
│   │   ├── i-media.repository.ts   # IMediaRepository
│   │   ├── i-user-media-repository.ts  # IUserMediaTrackingRepository
│   │   ├── i-tmdb-client.ts        # External API client
│   │   ├── i-igdb-client.ts        # External API client
│   │   └── i-episode-matcher.ts    # Domain service interface
│   └── index.ts
├── social/
│   ├── commands/
│   │   ├── follow-user.command.ts
│   │   ├── unfollow-user.command.ts
│   │   ├── update-profile.command.ts
│   │   └── toggle-profile-visibility.command.ts
│   ├── queries/
│   │   ├── get-profile.query.ts
│   │   ├── get-followers.query.ts
│   │   ├── get-following.query.ts
│   │   ├── search-users.query.ts
│   │   └── get-mutual-follows.query.ts
│   ├── dto/
│   │   ├── user-profile.dto.ts
│   │   ├── follow.dto.ts
│   │   └── search-result.dto.ts
│   ├── ports/
│   │   ├── i-profile.repository.ts  # IUserProfileRepository
│   │   ├── i-follow.repository.ts   # IFollowRepository
│   │   └── i-stats.service.ts       # Stats calculation service
│   └── index.ts
└── shared/
    ├── middleware/
    │   ├── validation.middleware.ts  # Validates DTOs with Zod/class-validator
    │   ├── authz.middleware.ts       # Authorization checks
    │   └── logging.middleware.ts
    ├── dto/
    │   ├── paginated-result.dto.ts
    │   ├── api-response.dto.ts       # Standardized { data, error, meta }
    │   └── common.dto.ts
    └── index.ts
```

## Patrones de Comandos

### Estructura de un Command

```typescript
// src/application/auth/commands/login.command.ts
export interface LoginCommand {
  email: EmailDTO;
  password: string;
}

export type LoginResult = Result<LoginSuccess, DomainError>;

export interface LoginSuccess {
  user: UserDto;
  tokens: AuthTokensDto;
}

export class LoginCommandHandler {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly authService: IAuthService,
    private readonly eventBus: IEventBus,
    private readonly logger: Logger
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    try {
      // 1. Validar input (ya validado por middleware, pero defensive)
      // 2. Recuperar usuario
      const user = await this.userRepo.findByEmail(command.email.value);
      if (!user) {
        return Result.failure(new NotFoundError('User not found'));
      }

      // 3. Verificar password (domain service)
      const isValid = await this.authService.verifyPassword(
        command.password,
        user.passwordHash
      );
      if (!isValid) {
        return Result.failure(new InvalidCredentialsError());
      }

      // 4. Generar tokens
      const accessToken = await this.tokenService.createAccessToken(user);
      const refreshToken = await this.tokenService.createRefreshToken(user);

      // 5. Publicar evento (opcional)
      await this.eventBus.publish(
        UserLoggedInEvent.create(user.id, new Date())
      );

      // 6. Retornar DTO
      return Result.success({
        user: UserDto.fromEntity(user),
        tokens: { accessToken, refreshToken },
      });
    } catch (error) {
      this.logger.error('LoginCommand failed', error);
      return Result.failure(error as DomainError);
    }
  }
}
```

### Registro de Handlers (DI)

```typescript
// src/application/auth/index.ts
export const authCommandHandlers = {
  login: LoginCommandHandler,
  logout: LogoutCommandHandler,
  register: RegisterUserCommandHandler,
  // ...
};

// En API Route:
import { authCommandHandlers } from '@/application/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const result = await authCommandHandlers.login.execute(body);
  return Response.json(result);
}
```

## Patrones de Queries

### Estructura de un Query Handler

```typescript
// src/application/social/queries/get-profile.query.ts
export interface GetProfileQuery {
  username: string;
  viewerUserId?: string;  // Para calcular follow status, privacidad
}

export class GetProfileQueryHandler {
  constructor(
    private readonly profileRepo: IUserProfileRepository,
    private readonly userRepo: IUserRepository,
    private readonly followRepo: IFollowRepository
  ) {}

  async execute(query: GetProfileQuery): Promise<GetProfileResult> {
    // 1. Obtener perfil
    const profile = await this.profileRepo.findByUsername(query.username);
    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    // 2. Obtener usuario (datos de auth)
    const user = await this.userRepo.findById(profile.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 3. Calcular privacidad
    const canView = profile.canView(query.viewerUserId);
    if (!canView && query.viewerUserId !== profile.userId) {
      throw new PermissionDeniedError('Profile is private');
    }

    // 4. Obtener followers/following (si es dueño o público)
    let followers: FollowerDto[] = [];
    let following: FollowingDto[] = [];
    if (profile.isPublic || query.viewerUserId === profile.userId) {
      followers = await this.followRepo.getFollowers(profile.userId);
      following = await this.followRepo.getFollowing(profile.userId);
    }

    // 5. Construir DTO
    return {
      profile: UserProfileDto.fromEntity(profile, user),
      followers,
      following,
      meta: {
        isOwnProfile: query.viewerUserId === profile.userId,
        isFollowing: query.viewerUserId
          ? await this.followRepo.isFollowing(query.viewerUserId, profile.userId)
          : false,
      },
    };
  }
}
```

## Validación de DTOs

### Con Zod (Recomendado)

```typescript
// src/application/auth/dto/auth.dto.ts
import { z } from 'zod';

export const LoginDto = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export type LoginDto = z.infer<typeof LoginDto>;

// Middleware
export async function validateDto<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  const result = schema.parse(data);
  return result;
}
```

### Sin librería (manual)

```typescript
export class LoginDtoValidator {
  static validate(input: unknown): ValidationResult<LoginDto> {
    if (typeof input !== 'object' || !input) {
      return ValidationResult.failure('Invalid input');
    }
    const { email, password } = input as any;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ValidationResult.failure('Invalid email');
    }
    if (!password || password.length < 6) {
      return ValidationResult.failure('Invalid password');
    }
    return ValidationResult.success({ email: email.toLowerCase(), password });
  }
}
```

## DTOs y mappers

### Entity → DTO

```typescript
// src/application/auth/dto/auth.dto.ts
export class UserDto {
  id: string;
  email: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  isVerified: boolean;
  isActive: boolean;

  static fromEntity(user: User): UserDto {
    return {
      id: user.id,
      email: user.email.value,
      username: user.username.value,
      fullName: user.fullName.value,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      isActive: user.isActive,
    };
  }
}
```

### Command → Entity

```typescript
export class RegisterUserCommandHandler {
  async execute(cmd: RegisterUserCommand): Promise<Result<UserDto, DomainError>> {
    // 1. Crear VO
    const email = new EmailVO(cmd.email);
    const username = new UsernameVO(cmd.username);
    const fullName = new FullNameVO(cmd.fullName);
    const password = await this.crypto.hash(cmd.password);

    // 2. Crear aggregate
    const user = User.register(
      email,
      username,
      fullName,
      password,
      this.userRepo // Repo pasado para chequear unicidad
    );

    // 3. Guardar
    await this.userRepo.save(user);

    // 4. Publish event
    await this.eventBus.publish(UserRegisteredEvent.from(user));

    // 5. Return DTO
    return Result.success(UserDto.fromEntity(user));
  }
}
```

## Manejo de Errores en Application Layer

```typescript
// Estrategia 1: Result pattern (funcional, preferido)
export type LoginResult =
  | { success: true; data: { user: UserDto; tokens: AuthTokensDto } }
  | { success: false; error: { code: string; message: string; details?: any } };

// Handler retorna Result
const result = await this.loginHandler.execute(cmd);
if (result.success) {
  return Response.json(result.data, { status: 200 });
} else {
  const status = this.mapErrorToStatus(result.error.code);
  return Response.json({ error: result.error }, { status });
}

// Estrategia 2: Excepciones (menos preferido, pero OK)
try {
  const userDto = await this.loginHandler.execute(cmd);
  return Response.json(userDto);
} catch (error) {
  if (error instanceof InvalidCredentialsError) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  if (error instanceof ValidationError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: 'Server error' }, { status: 500 });
}
```

## Event Bus y Eventos Cross-Context

```typescript
// Evento publicado desde Auth
export class UserRegisteredEvent extends DomainEvent {
  static create(userId: string, email: string): UserRegisteredEvent {
    return new UserRegisteredEvent({
      userId,
      email,
      occurredAt: new Date(),
      correlationId: generateUUID(),
    });
  }
}

// Evento consumido por Social (subscriber)
export class CreateProfileOnRegistration implements IEventSubscriber<UserRegisteredEvent> {
  constructor(private readonly profileRepo: IUserProfileRepository) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // Crear perfil vacío en Social context
    const profile = UserProfile.createForNewUser(event.payload.userId);
    await this.profileRepo.save(profile);
  }
}

// EventBus simple (in-memory)
export class InMemoryEventBus implements IEventBus {
  private subscribers: Map<string, IEventSubscriber<any>[]> = new Map();

  subscribe(eventType: string, subscriber: IEventSubscriber<any>): void {
    const list = this.subscribers.get(eventType) || [];
    list.push(subscriber);
    this.subscribers.set(eventType, list);
  }

  async publish(event: DomainEvent): Promise<void> {
    const type = event.constructor.name;
    const handlers = this.subscribers.get(type) || [];
    await Promise.allSettled(handlers.map(h => h.handle(event)));
  }
}
```

## Async vs Sync Commands

- **Async (la mayoría)**: acceso a DB, external APIs → `Promise<T>`
- **Sync**: cálculos puros, validaciones → `T`

```typescript
// Async
export class GetTrendingMediaQueryHandler {
  async execute(query: GetTrendingMediaQuery): Promise<PaginatedResult<MediaDto>> {
    return await this.mediaRepo.getTrending(query.type, query.period);
  }
}

// Sync (poco común en application layer)
export calculateMediaScore(media: Media, views: number): number {
  return (media.rating * 0.4) + (Math.log(views + 1) * 0.6);
}
```

## DTOs vs Primitivos

**NO usar**:
```typescript
// Anti-pattern
execute(userId: string, mediaId: string, status: string)
```

**Usar**:
```typescript
// Good
execute(command: ToggleFavoriteCommand)  // Tipado fuerte, semántica clara
```

## Inyección de Dependencias

```typescript
// src/application/auth/commands/login.command.ts (constructor)
constructor(
  private readonly userRepo: IUserRepository,
  private readonly tokenService: ITokenService,
  private readonly eventBus: IEventBus
) {}

// En API Route: factory manual (simple)
const userRepo = new SupabaseUserRepository(supabase);
const tokenService = new JwtTokenService(env.JWT_SECRET);
const eventBus = new InMemoryEventBus();
const handler = new LoginCommandHandler(userRepo, tokenService, eventBus);
const result = await handler.execute({ email, password });
```

## CQRS Ligero (Read/Write Separation)

```typescript
// Modelo de comando (write)
interface MarkAsWatchedCommand {
  userId: string;
  mediaId: string;
  mediaType: MediaType;
  progressMinutes?: number;
}

// Modelo de consulta (read) – puede ser distinto
interface UserMediaStateDto {
  mediaId: string;
  mediaType: MediaType;
  isWatched: boolean;
  isFavorite: boolean;
  progressMinutes?: number;
}

// Handler de comando escribe y dispara eventos
// Handler de consulta solo lee (no muta estado)
```

## Tests de Application Layer

```typescript
// tests/application/auth/login.command.test.ts
describe('LoginCommandHandler', () => {
  let userRepo: Mock<IUserRepository>;
  let tokenService: Mock<ITokenService>;
  let handler: LoginCommandHandler;

  beforeEach(() => {
    userRepo = mock<IUserRepository>();
    tokenService = mock<ITokenService>();
    handler = new LoginCommandHandler(userRepo, tokenService, /* ... */);
  });

  it('should return error if user not found', async () => {
    userRepo.findByEmail.resolves(null);

    const result = await handler.execute({ email: 'test@test.com', password: '123' });

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('USER_NOT_FOUND');
  });

  it('should login successfully', async () => {
    const user = User.register(new EmailVO('test@test.com'), ...);
    userRepo.findByEmail.resolves(user);
    tokenService.createAccessToken.resolves('access-token');
    tokenService.createRefreshToken.resolves('refresh-token');

    const result = await handler.execute({ email: 'test@test.com', password: 'correct' });

    expect(result.success).toBe(true);
    expect(result.data.user.email).toBe('test@test.com');
  });
});
```

---

**Próximo**: [Infrastructure Layer](./infrastructure.md)
