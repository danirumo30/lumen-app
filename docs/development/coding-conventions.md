# Convenciones de Código

## Propósito

Este documento define el estándar de código para Lumen App. Seguir estas reglas asegura consistencia, mantenibilidad y calidad.

## Stack Tecnológico

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: TanStack Query v5
- **Linting**: ESLint 9 (Next.js config)
- **Testing**: Vitest + Playwright
- **Database**: Supabase (PostgreSQL)

## TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@/domain/*": ["./src/domain/*"],
      "@/application/*": ["./src/application/*"],
      "@/infrastructure/*": ["./src/infrastructure/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts"
  ],
  "exclude": ["node_modules", "tests/e2e", "playwright.config.ts", "scripts"]
}
```

## reglas estrictas de TypeScript

- ✅ `strict: true`
- ✅ `noImplicitAny: true` (incluido en strict)
- ✅ `noUnusedLocals: true` (ESLint)
- ✅ `noUnusedParameters: true` (ESLint)
- ✅ `noImplicitReturns: true` (ESLint)
- ❌ `any` **PROHIBIDO** excepto:
  - En tests (mock objects, any[] para fixtures)
  - En `global.d.ts` para librerías sin tipos
  - Temporalmente con `@ts-expect-error` y comment explicativo

**Si ves error "Unexpected any"** → reemplaza con tipo específico o `unknown`.

## ESLint Reglas Clave

```javascript
// eslint.config.mjs (resumen)
extends: ['next/core-web-vitals', 'next/typescript']

rules: {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
  '@typescript-eslint/consistent-type-imports': 'error',
  '@typescript-eslint/no-require-imports': 'error',
  // ...
}
```

## Formateo de Código

- **Indentación**: 2 espacios
- **Punto y coma**: ❌ omitido (semi: false)
- **Comillas**: simples para strings, dobles para JSX attributes
- **Template strings**: para interpolación `${}`
- **Línea máxima**: 100 caracteres (Tailwind permite overflow)

## Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Archivos (componentes) | PascalCase | `ProfileHeader.tsx` |
| Archivos (hooks, utils) | camelCase | `use-auth.hook.ts`, `get-base-url.ts` |
| Archivos (tests) | kebab-case | `user-entity.test.ts` |
| Clases/Interfaces/Types | PascalCase | `UserDto`, `IUserRepository` |
| Funciones/variables | camelCase | `getUserProfile`, `isValidEmail` |
| Constantes (export) | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Enums | PascalCase | `MediaType` |
| Tipo genérico params | T, K, V | `class Repository<T>` |

## Estructura de Carpetas

### Raíz del Proyecto

```
lumen-app/
├── .agents/              # OpenCode agent config
├── .atl/                 # SDD artifacts
├── docs/                 # Documentation (architecture, ADRs, guides)
│   ├── architecture/
│   ├── adr/
│   ├── development/
│   └── diagrams/
├── src/
│   ├── app/              # Next.js App Router (pages, layouts, api routes)
│   ├── components/       # React components (UI)
│   ├── domain/           # DDD domain layer
│   ├── application/      # Use cases, commands, queries
│   ├── infrastructure/   # Adapters, repositories, clients
│   ├── shared/           # Technical utilities
│   ├── types/            # External API types
│   └── lib/              # ❌ DEPRECATED – mover a infrastructure/shared
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/               # Static assets
├── .env.local            # Environment variables (not committed)
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── README.md
└── CHANGELOG.md
```

### Componentes (`src/components/`)

```
src/components/
├── auth/                  # Auth-related components
├── discover/              # Discover page components
├── home/                  # Homepage carousels
├── layout/                # Header, Footer, Layout
├── profile/               # Profile page components
├── shared/                # Reusable UI (ErrorPage, NotFoundPage)
├── ui/                    # shadcn/ui base components (Button, Modal, Toast)
└── [domain]/              # Optional: domain-specific UI components
```

**Regla**: Un componente por archivo. Exportación named export.

```typescript
// src/components/profile/ProfileHeader.tsx
export function ProfileHeader({ user, stats }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      <Avatar src={user.avatarUrl} />
      <div>
        <h1>{user.username}</h1>
        <StatsRow stats={stats} />
      </div>
    </div>
  );
}

// export default PROHIBIDO para componentes del proyecto
```

### API Routes (`src/app/api/`)

```
src/app/api/
├── auth/
│   ├── login/route.ts
│   ├── register/route.ts
│   ├── confirm-email/route.ts
│   └── ...
├── user/
│   ├── tv-status/route.ts
│   ├── movie-status/route.ts
│   └── ...
└── ...
```

**Formato route.ts**:
```typescript
// GET, POST, PUT, DELETE, PATCH
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
```

## Imports y Organización

### Orden de imports

```typescript
// 1. External packages (node_modules)
import React from 'react';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// 2. Internal modules (alias paths)
//   a. Domain
import { User } from '@/domain/auth/entities/user.entity';
import { IUserRepository } from '@/domain/auth/repository/user-repository.port';
//   b. Application
import { LoginCommandHandler } from '@/application/auth/commands/login.command';
import type { LoginDto } from '@/application/auth/dto/auth.dto';
//   c. Infrastructure
import { SupabaseUserRepository } from '@/infrastructure/persistence/supabase/auth/supabase-auth.repository';
//   d. Shared/Utilities
import { logger } from '@/shared/logger';
import { Result } from '@/domain/shared/value-objects/result';

// 3. Relative imports (si es necesario, pero preferir alias)
import { Button } from '@/components/ui/button';

// Separación entre grupos: blank line
```

### Prohibido

- ❌ `import * as X from '...'` → usar named imports
- ❌ `require()` → usar `import`
- ❌ Relative paths complejos (`../../../`) → usar alias `@/`
- ❌ Importar desde `src/lib/` (legacy)
- ❌ Importar desde `src/modules/` (migrado)

## Patrones de Componentes React

### Server Components por Default

Next.js App Router usa Server Components por defecto. Usar `'use client'` solo cuando necesites:

- Hooks de React (`useState`, `useEffect`, `useQuery`)
- Event handlers inline
- Mutable state

**Ejemplo**:
```tsx
// src/app/profile/[username]/page.tsx – Server Component (no 'use client')
export default async function ProfilePage({ params }: { params: { username: string } }) {
  const profile = await fetchProfile(params.username);  // Direct server fetch
  return <ProfileHeader user={profile.user} />;
}

// src/components/profile/ProfileHeader.tsx – Puede ser Client Component si tiene interactividad
'use client';
import { useState } from 'react';
export function ProfileHeader({ user }: ProfileHeaderProps) { ... }
```

### Custom Hooks

- Ubicación: `src/infrastructure/react-query/hooks/` o `src/infrastructure/hooks/`
- Nombre: `use-{domain}.hook.ts`
- Exportación: named exports (functions), default export PROHIBIDO

```typescript
// src/infrastructure/react-query/hooks/use-auth.hook.ts
export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'current'],
    queryFn: fetchCurrentUser,
  });

  const login = useMutation({
    mutationFn: (credentials: LoginDto) => loginCommand.execute(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'current'], data.user);
    },
  });

  return { user, isLoading, login };
}
```

## Tailwind CSS

### Orden de clases

1. **Layout**: `flex`, `grid`, `block`, `hidden`
2. **Sizing**: `w-`, `h-`, `min-w-`, `max-h-`
3. **Spacing**: `m-`, `p-`, `gap-`
4. **Positioning**: `relative`, `absolute`, `inset-`
5. **Typography**: `text-`, `font-`, `leading-`
6. **Colors**: `bg-`, `text-`, `border-`
7. **Effects**: `shadow-`, `opacity-`, `blur-`
8. **States**: `hover:`, `focus:`, `disabled:`
9. **Dark mode**: `dark:` prefijos
10. **Responsive**: `sm:`, `md:`, `lg:`, `xl:`

**Ejemplo**:
```tsx
<button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50">
```

### shadcn/ui Components

Usar componentes base de `@/components/ui/`:

```tsx
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
```

## Manejo de Errores

### Domain Errors

```typescript
import { ValidationError, NotFoundError, ConflictError } from '@/domain/shared/errors';

throw new ValidationError('Email inválido', { field: 'email' });
throw new NotFoundError('User not found', { userId });
throw new ConflictError('Email already exists', { email });
```

### Application Layer Errors

Retornar `Result<T>` patterns:

```typescript
const result = await loginCommand.execute(dto);
if (result.isFailure) {
  return Response.json({ error: result.error.message }, { status: 400 });
}
return Response.json(result.value);
```

### HTTP Errors

```typescript
// src/infrastructure/http/errors/http-exception.ts
export class HttpException extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

// Throw en middleware o API route
throw new HttpException(400, 'Invalid input', { errors: zodErrors });
```

## Tests

### Estructura de Tests

```
tests/
├── unit/
│   ├── domain/
│   │   ├── auth/
│   │   ├── media/
│   │   └── social/
│   ├── application/
│   └── infrastructure/
├── integration/
│   ├── api/
│   └── supabase/
└── e2e/
    └── screenshots/
```

### Test File Naming

- `{nombre}.test.ts` o `{nombre}.spec.ts`
- Para entidad: `user.entity.test.ts`
- Para use case: `login.command.test.ts`

### Ejemplo de Test Unitario

```typescript
// tests/unit/domain/auth/user.entity.test.ts
import { describe, it, expect } from 'vitest';
import { User } from '@/domain/auth/entities/user.entity';
import { EmailVO, UsernameVO, FullNameVO } from '@/domain/auth/value-objects';

describe('User Entity', () => {
  it('should register new user', () => {
    const email = new EmailVO('test@example.com');
    const username = new UsernameVO('john');
    const fullName = new FullNameVO('John Doe');
    const passwordHash = 'hashed123';

    const user = User.register(email, username, fullName, passwordHash);

    expect(user.id).toBeInstanceOf(UserId);
    expect(user.email.equals(email)).toBe(true);
    expect(user.isVerified).toBe(false);
  });

  it('should throw if email invalid', () => {
    expect(() => new EmailVO('invalid')).toThrow(ValidationError);
  });
});
```

### Ejemplo de Test con Mocks

```typescript
// tests/unit/application/auth/login.command.test.ts
import { mock } from 'vitest-mock-extended';
import { LoginCommandHandler } from '@/application/auth/commands/login.command';

describe('LoginCommandHandler', () => {
  let userRepo: Mock<IUserRepository>;
  let handler: LoginCommandHandler;

  beforeEach(() => {
    userRepo = mock<IUserRepository>();
    handler = new LoginCommandHandler(userRepo, /* other deps */);
  });

  it('should login successfully', async () => {
    const user = User.register(/* ... */);
    userRepo.findByEmail.resolves(user);

    const result = await handler.execute({ email: 'test@example.com', password: '123' });

    expect(result.isSuccess).toBe(true);
    expect(result.value.user.email).toBe('test@example.com');
  });
});
```

## Convenciones de Commits

Usamos **Conventional Commits**:

```
<tipo>(<scope>): <subject>

<body>

<footer>
```

### Tipos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Bug fix |
| `refactor` | Refactorización sin cambio funcional |
| `docs` | Cambios en documentación |
| `test` |Tests (add, fix, refactor) |
| `chore` | Build, CI, config changes |
| `perf` | Mejora de performance |
| `style` | Formato, whitespace (sin code change) |
| `break` | Breaking change (incompatible) |

### Scopes

Scopes definidos:

- `[auth]` – Autenticación, autorización
- `[media]` – Catálogo, seguimiento de medios
- `[social]` – Perfiles, seguidores, estadísticas
- `[shared]` – Utilidades compartidas (domain/shared)
- `[arch]` – Cambios de arquitectura, estructura de carpetas
- `[infra]` – Infraestructura (Supabase, TMDB, IGDB)
- `[ui]` – Componentes, Tailwind, UI/UX
- `[tests]` – Tests unitarios/integración/e2e
- `[ci]` – CI/CD, workflows
- `[deps]` – Dependencias (npm packages)

### Ejemplos

```
feat(auth): add email verification with custom flow

- Implement custom email verification using tokens table
- Create email service adapter with Nodemailer
- Add verification modal in login page
- Disable Supabase auto-confirmation

Closes #123

docs(arch): complete ADR 002Clean Architecture layers

Add detailed explanation of dependency rule, layer responsibilities,
and migration strategy.

fix(media): correct user media state validation error

The platinum flag required being watched but test was invalid.
Fix test to pass valid parameters only.

refactor(ui): convert ProfileHeader to client component for interactivity

Needed hover states and click handlers for follow button.

chore(deps): update Next.js to 16.1.6 and React 19.2.3

feat(media)!: rename API endpoints to RESTful style

BREAKING CHANGE:
/api/user/tv-status → /api/v1/user/media/tracking
/api/user/movie-favorite → /api/v1/user/media/favorites

Old endpoints will be removed in v2.0.
```

---

**Próximo**: [Testing Strategy](./testing.md)
