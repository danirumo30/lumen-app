# Estrategia de Testing

## Filosofía

Testing en Lumen App sigue la pirámide:

```
        [E2E] Playwright (20%)
           /\
          /  \
         /    \
    [Integración] Vitest (30%)
         /\
        /  \
       /    \
  [Unitarios] Vitest (50%)
```

- **Unitarios**: Domain layer, application services, utilities. Rápidos, aislados, sin DB.
- **Integración**: API routes + DB mockeado o test database.
- **E2E**: Flujos completos en navegador real (Playwright).

## Estructura de Tests

```
tests/
├── unit/
│   ├── domain/
│   │   ├── auth/
│   │   │   ├── user.entity.test.ts
│   │   │   ├── email.vo.test.ts
│   │   │   └── ...
│   │   ├── media/
│   │   │   ├── user-media-state.test.ts
│   │   │   ├── media-id.vo.test.ts
│   │   │   └── ...
│   │   ├── social/
│   │   │   ├── user-profile.entity.test.ts
│   │   │   └── ...
│   │   └── shared/
│   │       ├── result.test.ts
│   │       └── ...
│   ├── application/
│   │   ├── auth/
│   │   │   ├── login.command.test.ts
│   │   │   └── ...
│   │   ├── media/
│   │   └── social/
│   └── infrastructure/
│       ├── supabase/
│       └── external/
├── integration/
│   ├── api/
│   │   ├── auth-api.test.ts
│   │   ├── tv-tracking.test.ts
│   │   └── ...
│   └── supabase/
│       └── connection.test.ts
└── e2e/
    ├── auth-flow.test.ts
    ├── movie-detail.spec.ts
    ├── tv-tracking.spec.ts
    └── screenshots/
```

## 1. Unit Testing (Vitest)

### Domain Layer Tests

**Objetivo**: Probar lógica de negocio pura, invariantes, factories.

```typescript
// tests/unit/domain/auth/user.entity.test.ts
import { describe, it, expect } from 'vitest';
import { User } from '@/domain/auth/entities/user.entity';
import { EmailVO, UsernameVO, FullNameVO } from '@/domain/auth/value-objects';

describe('User Entity', () => {
  describe('register factory', () => {
    it('should create new user with unverified email', () => {
      const email = new EmailVO('test@example.com');
      const username = new UsernameVO('john');
      const fullName = new FullNameVO('John Doe');
      const passwordHash = 'hashed_pw';

      const user = User.register(email, username, fullName, passwordHash);

      expect(user.id).toBeInstanceOf(UserId);
      expect(user.email.equals(email)).toBe(true);
      expect(user.username.value).toBe('john');
      expect(user.isVerified).toBe(false);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique IDs', () => {
      const email = new EmailVO('test@example.com');
      const username = new UsernameVO('john');
      
      const user1 = User.register(email, username, new FullNameVO('John'), 'hash');
      const user2 = User.register(email, username, new FullNameVO('Jane'), 'hash');

      expect(user1.id.equals(user2.id)).toBe(false);
    });
  });

  describe('verifyEmail', () => {
    it('should mark user as verified', () => {
      const user = User.register(
        new EmailVO('test@example.com'),
        new UsernameVO('john'),
        new FullNameVO('John'),
        'hash'
      );

      user.verifyEmail();

      expect(user.isVerified).toBe(true);
      expect(user.emailVerifiedAt).toBeDefined();
    });

    it('should throw if already verified', () => {
      const user = User.register(...);
      user.verifyEmail();
      
      expect(() => user.verifyEmail()).toThrow(ConflictError);
    });
  });

  describe('invariants', () => {
    it('should enforce unique email per user (delegated to repo)', () => {
      // Invariant is checked at repo level, not in entity
      // Entity accepts any EmailVO
    });
  });
});
```

### Application Layer Tests

**Objetivo**: Probar orquestación de comandos/queries con mocks.

```typescript
// tests/unit/application/auth/login.command.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mock } from 'vitest-mock-extended'; // or vi.fMock()
import { LoginCommandHandler } from '@/application/auth/commands/login.command';
import { IUserRepository } from '@/domain/auth/repository/user-repository.port';
import { IAuthService } from '@/domain/auth/services/auth.service.port';
import { ITokenService } from '@/application/auth/ports/i-token.service';
import { IEventBus } from '@/domain/shared/events/event-bus.port';
import { User } from '@/domain/auth/entities/user.entity';
import { EmailVO, UsernameVO, FullNameVO } from '@/domain/auth/value-objects';

describe('LoginCommandHandler', () => {
  let userRepo: Mock<IUserRepository>;
  let authService: Mock<IAuthService>;
  let tokenService: Mock<ITokenService>;
  let eventBus: Mock<IEventBus>;
  let handler: LoginCommandHandler;

  beforeEach(() => {
    userRepo = mock<IUserRepository>();
    authService = mock<IAuthService>();
    tokenService = mock<ITokenService>();
    eventBus = mock<IEventBus>();

    handler = new LoginCommandHandler(
      userRepo,
      authService,
      tokenService,
      eventBus
    );
  });

  it('should return error if user not found', async () => {
    userRepo.findByEmail.resolves(null);

    const result = await handler.execute({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it('should return error if password invalid', async () => {
    const user = User.register(
      new EmailVO('test@example.com'),
      new UsernameVO('test'),
      new FullNameVO('Test User'),
      'hash'
    );
    userRepo.findByEmail.resolves(user);
    authService.verifyPassword.resolves(false);

    const result = await handler.execute({
      email: 'test@example.com',
      password: 'wrong',
    });

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(AuthenticationError);
  });

  it('should login successfully and publish event', async () => {
    const user = User.register(
      new EmailVO('test@example.com'),
      new UsernameVO('test'),
      new FullNameVO('Test'),
      'hash'
    );
    userRepo.findByEmail.resolves(user);
    authService.verifyPassword.resolves(true);
    tokenService.generateAccessToken.resolves('access-token');
    tokenService.generateRefreshToken.resolves('refresh-token');

    const result = await handler.execute({
      email: 'test@example.com',
      password: 'correct',
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.user.email).toBe('test@example.com');
    expect(result.value.tokens.accessToken).toBe('access-token');
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'UserLoggedInEvent' })
    );
  });
});
```

### Infrastructure Tests

Mock Supabase client:

```typescript
// tests/unit/infrastructure/persistence/supabase-auth.repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SupabaseUserRepository } from '@/infrastructure/persistence/supabase/auth/supabase-auth.repository';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PostgrestResponse } from '@supabase/postgrest-js';

// Mock supabase client
vi.mock('@supabase/supabase-js');

describe('SupabaseUserRepository', () => {
  let repo: SupabaseUserRepository;
  let supabase: Mock<SupabaseClient>;

  beforeEach(() => {
    supabase = createMock<SupabaseClient>();
    repo = new SupabaseUserRepository(supabase);
  });

  it('should find user by email', async () => {
    const mockDbUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'test',
      full_name: 'Test User',
      password_hash: 'hash',
      is_verified: false,
      email_verified_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    supabase.from().select().eq().single.resolves({ data: mockDbUser, error: null });

    const user = await repo.findByEmail(new EmailVO('test@example.com'));

    expect(user).not.toBeNull();
    expect(user!.email.value).toBe('test@example.com');
  });
});
```

## 2. Integration Testing

### API Routes Integration Tests

Conectar a test database o usar mocks más complejos.

```typescript
// tests/integration/api/auth-api.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { GET, POST } from '@/app/api/auth/register/route';

const testSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_TEST_ANON_KEY!
);

describe('POST /api/auth/register', () => {
  it('should register new user', async () => {
    const response = await POST(new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test-integration@example.com',
        username: 'testuser',
        password: 'SecurePass123',
        fullName: 'Test User',
      }),
    }));

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.user.email).toBe('test-integration@example.com');
  });
});
```

### Database Fixtures

```typescript
// tests/integration/fixtures/users.ts
export async function createTestUser(supabase: SupabaseClient, overrides?: Partial<User>) {
  const user = {
    email: `test-${Date.now()}@example.com`,
    username: `user-${Date.now()}`,
    full_name: 'Test User',
    password_hash: await hash('password123'),
    is_verified: false,
    ...overrides,
  };

  const { data, error } = await supabase
    .from('users')
    .insert(user)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cleanupTestUser(supabase: SupabaseClient, userId: string) {
  await supabase.from('users').delete().eq('id', userId);
}
```

## 3. End-to-End Testing (Playwright)

### Flujos Completos

```typescript
// tests/e2e/auth-flow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('should register, verify, and login', async ({ page }) => {
    // 1. Go to homepage
    await page.goto('/');

    // 2. Open login modal
    await page.click('button:has-text("Iniciar Sesión")');
    await page.click('button:has-text("Crear cuenta")');

    // 3. Fill register form
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="username"]', 'testuser');
    await page.fill('[name="password"]', 'SecurePass123');
    await page.fill('[name="fullName"]', 'Test User');
    await page.click('button:has-text("Crear cuenta")');

    // 4. Expect verification message
    await expect(page.locator('[data-testid="verification-message"]')).toBeVisible();

    // 5. Simulate verification (dev only)
    await page.click('button:has-text("Simular verificación")');
    await expect(page.locator('[data-testid="verification-success"]')).toBeVisible();

    // 6. Login
    await page.click('button:has-text("Iniciar Sesión")');
    await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('[name="password"]', 'SecurePass123');
    await page.click('button:has-text("Entrar")');

    // 7. Expect redirect to home and user menu visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

### Screenshots on Failure

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  outputDir: 'test-results/',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
});
```

## 4. Test Database Setup

### Environment Variables

```bash
# .env.test.local
SUPABASE_URL=postgresql://localhost:5432/lumen_test
SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
```

### Test Isolation

```typescript
// tests/setup.ts (vitest global setup)
import { beforeAll, afterEach, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

let testSupabase: SupabaseClient;

beforeAll(async () => {
  testSupabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_TEST_ANON_KEY!
  );
});

afterEach(async () => {
  // Clean up test data between tests
  const { data: users } = await testSupabase
    .from('users')
    .select('id')
    .ilike('email', 'test-%@example.com');
  
  if (users) {
    const ids = users.map(u => u.id);
    await testSupabase.from('users').delete().in('id', ids);
    await testSupabase.from('user_profiles').delete().in('user_id', ids);
    // ... other tables
  }
});

export { testSupabase };
```

### Using Testcontainers (Avanzado)

```typescript
// Levantar PostgreSQL en Docker para tests aislados
import { GenericContainer } from 'testcontainers';

let container: GenericContainer;
let dbUrl: string;

beforeAll(async () => {
  container = new GenericContainer('postgres')
    .withExposedPorts(5432)
    .withEnv('POSTGRES_PASSWORD', 'test')
    .withEnv('POSTGRES_DB', 'lumen_test');
  
  const started = await container.start();
  const port = started.getMappedPort(5432);
  dbUrl = `postgresql://postgres:test@localhost:${port}/lumen_test`;
});
```

## 5. Coverage

```bash
# Generar reporte de cobertura
npx vitest run --coverage

# Configurar threshold en vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  thresholds: {
    statements: 80,
    functions: 80,
    branches: 70,
    lines: 80,
  },
  include: ['src/domain/**', 'src/application/**'],
  exclude: ['src/types/**', 'src/lib/**'],
},
```

## 6. Mocking

### Mock de Repositorios

```typescript
// Con vitest-mock-extended
import { mock } from 'vitest-mock-extended';

const userRepo = mock<IUserRepository>();
userRepo.findByEmail.resolves(user);

// O con vi.fMock()
vi.fMock<IUserRepository>();
userRepo.findByEmail.mockResolvedValue(user);
```

### Mock de Fetch (para external APIs)

```typescript
// tests/unit/infrastructure/external/tmdb-client.test.ts
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ id: 123, title: 'Test Movie' }),
  } as Response)
) as any;
```

## 7. Nombres de Tests

Usar formato **describe/it** claro:

```typescript
describe('User Entity', () => {
  describe('register factory', () => {
    it('should create user with unverified email');
    it('should generate unique IDs');
    it('should enforce minimum username length');
  });

  describe('verifyEmail', () => {
    it('should mark user as verified');
    it('should set emailVerifiedAt timestamp');
    it('should throw if already verified');
  });

  describe('invariants', () => {
    it('should not allow negative runtime in Media');
    it('should require platinum to be watched');
  });
});
```

## Comandos npm

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Convenciones

- ✅ Unit tests en carpeta junto al código: `src/**/__tests__/` or `tests/unit/`
- ✅ Integration tests en `tests/integration/`
- ✅ E2E tests en `tests/e2e/`
- ✅ Test files: `*.test.ts` o `*.spec.ts`
- ✅ Usar `describe` agrupando lógica relacionada
- ✅ Tests deben ser **deterministic** (no dependen de Date.now(), random)
- ✅ Mock external services (TMDB, IGDB, email SMTP)
- ✅ DB tests: limpiar data después de cada test (`afterEach`)

---

**Próximo**: [Commit Messages](./commit-messages.md)
