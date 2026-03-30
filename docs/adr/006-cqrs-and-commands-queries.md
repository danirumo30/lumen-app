# ADR 006: CQRS and Commands/Queries Separation

**Status:** Accepted  
**Date:** 2026-03-29  
**Commit:** 957959f  

---

## Context

¿Debemos separar formalmente el modelo de lectura (queries) del modelo de escritura (commands)? Nuestra aplicación tiene casos de uso mixtos en `src/application/*/` y necesitamos decidir si implementamos CQRS estricto o ligero.

## Decision

### CQRS Ligero (Command-Query Separation, no strict CQRS)

**No implementaremos full CQRS** (separación física de modelos de datos, read replicas, etc.). Pero **sí separamos operaciones** en:

- **Commands**: Cambian estado → `POST/PUT/DELETE` → devuelven `Result<T>` o `void`
- **Queries**: Solo lectura → `GET` → devuelven `T` (o `PaginatedResult<T>`)

### Estructura de Carpetas

```
src/application/auth/
├── commands/      # Mutaciones (login, register, logout)
│   ├── login.command.ts
│   ├── register.command.ts
│   └── ...
├── queries/       # Consultas (get profile, get current user)
│   ├── get-profile.query.ts
│   ├── get-current-user.query.ts
│   └── ...
├── dto/           # DTOs compartidos
│   ├── auth.dto.ts (UserDto, LoginDto, RegisterDto)
│   └── ...
└── ports/         # Interfaces
    ├── i-auth.repository.ts
    └── ...
```

### Command Handler Pattern

```typescript
// src/application/auth/commands/login.command.ts
export interface LoginCommand {
  email: string;      // Primitive inputs (validated by middleware)
  password: string;
}

// Handler (use case)
export class LoginCommandHandler {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly authService: IAuthService,
    private readonly tokenService: ITokenService,
    private readonly eventBus: IEventBus
  ) {}

  async execute(cmd: LoginCommand): Promise<LoginResult> {
    // 1. Validate input (already done by middleware ideally)
    // 2. Business logic
    const user = await this.userRepo.findByEmail(cmd.email);
    if (!user) return Result.failure(new NotFoundError('User not found'));

    const valid = await this.authService.verifyPassword(cmd.password, user.passwordHash);
    if (!valid) return Result.failure(new AuthenticationError('Invalid credentials'));

    // 3. Generate tokens
    const tokens = await this.tokenService.generateForUser(user);

    // 4. Publish event
    await this.eventBus.publish(UserLoggedInEvent.create(user.id.value));

    // 5. Return DTO (not Entity!)
    return Result.success({
      user: UserDto.fromEntity(user),
      tokens: AuthTokensDto.fromTokens(tokens),
    });
  }
}
```

**Characteristics**:
- Returns `Result<T>` or throws `DomainError`
- No side effects beyond intent (command is executed once)
- Idempotent? Depende. Login no es idempotente (genera tokens nuevos). MarkAsWatched es idempotente.
- Validated by middleware pre-execution

### Query Handler Pattern

```typescript
// src/application/social/queries/get-profile.query.ts
export interface GetProfileQuery {
  username: string;
  viewerUserId?: string;  // Para calcular follow status
}

export class GetProfileQueryHandler {
  constructor(
    private readonly profileRepo: IUserProfileRepository,
    private readonly userRepo: IUserRepository,
    private readonly followRepo: IFollowRepository
  ) {}

  async execute(query: GetProfileQuery): Promise<GetProfileResult> {
    // 1. Load aggregate(s)
    const profile = await this.profileRepo.findByUsername(query.username);
    if (!profile) throw new NotFoundError('Profile not found');

    const user = await this.userRepo.findById(profile.userId);
    if (!user) throw new NotFoundError('User not found');

    // 2. Check authorization (query-level)
    const canView = profile.canView(query.viewerUserId);
    if (!canView && query.viewerUserId !== profile.userId) {
      throw new PermissionDeniedError('Profile is private');
    }

    // 3. Load related data as needed (single roundtrip if possible)
    const [followers, following] = await Promise.all([
      query.viewerUserId === profile.userId
        ? this.followRepo.getFollowers(profile.userId)
        : Promise.resolve([]),
      query.viewerUserId === profile.userId
        ? this.followRepo.getFollowing(profile.userId)
        : Promise.resolve([]),
    ]);

    // 4. Return DTO (no Entity!)
    return {
      profile: UserProfileDto.fromEntity(profile, user),
      followers: followers.map(f => FollowerDto.fromEntity(f)),
      following: following.map(f => FollowingDto.fromEntity(f)),
      meta: {
        isOwnProfile: query.viewerUserId === profile.userId,
        // ...
      },
    };
  }
}
```

**Characteristics**:
- Returns data only (no state change)
- Can be cached aggressively (React Query)
- Should be fast (optimize queries, eager load)
- No side effects (pure function)

### API Routes Mapping

```typescript
// src/app/api/auth/login/route.ts
export async function POST(request: Request) {
  // 1. Validate DTO
  const dto = await validateDto(LoginDto)(request);
  
  // 2. Execute command
  const handler = new LoginCommandHandler(
    userRepo, authService, tokenService, eventBus
  );
  const result = await handler.execute(dto);
  
  // 3. Map result to HTTP response
  if (result.isFailure) {
    return mapDomainErrorToResponse(result.error);
  }
  return Response.json(result.value, { status: 200 });
}

// src/app/api/profile/[username]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  const query: GetProfileQuery = {
    username: params.username,
    viewerUserId: request.headers.get('x-user-id'), // header set by auth middleware
  };

  const handler = new GetProfileQueryHandler(profileRepo, userRepo, followRepo);
  const result = await handler.execute(query);
  
  return Response.json(result);
}
```

### CQRS vs Non-CQRS Endpoints

| Endpoint | Type | Handler | DTO |
|----------|------|---------|-----|
| POST `/api/auth/login` | Command | `LoginCommandHandler` | `LoginDto` |
| POST `/api/auth/register` | Command | `RegisterCommandHandler` | `RegisterDto` |
| GET `/api/profile/john` | Query | `GetProfileQueryHandler` | `GetProfileQuery` |
| POST `/api/user/tv-status` | Command | `ToggleTvStatusCommand` | `ToggleTvStatusDto` |
| GET `/api/user/media` | Query | `GetUserMediaQuery` | `GetUserMediaQuery` |

### When to Use Query vs Command

- **Command**: If modifica estado en DB → `POST/PUT/DELETE/PATCH`
- **Query**: Solo lee → `GET`

Exception: Sometimes a mutation returns the updated state (common). Still Command, but returns DTO.

```typescript
// Command that returns updated entity (common)
POST /api/user/media
→ ToggleFavoriteCommand
Returns: UserMediaStateDto
```

### Benefits of This Separation

1. **Intent clarity**: Command = change something, Query = read something
2. **Caching**: Queries easy to cache (React Query), commands never cached
3. **Testing**: Mock repos separately, test side effects vs data fetching
4. **Security**: Authorization can differ for same-dto but different intent (ej. ver vs editar perfil)

### Drawbacks

- **More files**: Every operation gets command + handler + DTO
- **Boilerplate**: Simple endpoint (ej. health check) puede ser excesivo
- **Learning curve**: New devs preguntan "¿por qué no un simple handler?"

### Mitigation

- Accept that simple queries can be **inline** in API route without separate handler:
  ```typescript
  // Simple query, no complex orchestration
  GET /api/health → return { status: 'ok' } directly
  ```
- Use **code generation** para boilerplate (future)

---

**Próximo**: [Migration Strategy](./007-migration-strategy.md)
