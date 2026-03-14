# Skill: Arquitectura Hexagonal y DDD en Lumen

## Contexto
Esta skill se activa siempre que se trabaje en la estructura de carpetas, creación de módulos, entidades de dominio o servicios de aplicación del proyecto Lumen. Su objetivo es garantizar que la lógica de negocio (tracking de media, red social, estadísticas) sea totalmente independiente de herramientas externas (Supabase, Next.js, TMDB, IGDB).

## Reglas de Oro (The Core Rules)

### 1. Pureza del Dominio
Las entidades (`User`, `Media`) son clases puras de TypeScript. **PROHIBIDO** importar tipos de `@supabase/supabase-js`, librerías de UI o cualquier dependencia de infraestructura en `src/modules/*/domain`.

### 2. Inversión de Dependencias
La capa de `Application` solo conoce interfaces (Ports). La implementación real (el "Adapter") se inyecta en tiempo de ejecución.

### 3. Mappers Obligatorios
Los datos de DB o APIs externas deben pasar por un `Mapper` en `Infrastructure` para convertirse en un objeto del `Domain`.

### 4. Single Source of Truth
El ID de la media será el de la API externa (prefijado con `tmdb_` o `igdb_`), pero la "verdad" del estado (visto/favorito) reside en nuestra base de datos en Supabase.

### 5. Separación de Concerns
- **Código fuente** en `src/`
- **Tests** en `tests/` (separados del código fuente)
- **Scripts** en `scripts/` (TypeScript, no JavaScript)
- **Documentación** en `docs/`
- **Configuración** en archivos específicos (`.github/`, `.vercel/`, etc.)

## Mapa de Directorios (The Hexagonal Map)

### Estructura General del Proyecto

```
lumen-app/
├── .github/                    # Configuración de GitHub
│   ├── workflows/              # CI/CD pipelines
│   └── AGENTS.md              # Configuración del agente
├── .vercel/                    # Configuración de Vercel
│   └── project.json
├── .supabase/                  # Configuración de Supabase
│   └── config.toml
├── docs/                       # Documentación
│   ├── proposals/              # Propuestas de funcionalidades
│   ├── features/               # Documentación de features
│   ├── guides/                 # Guías de uso
│   └── architecture/           # Documentación de arquitectura
├── scripts/                    # Scripts de desarrollo (TypeScript)
│   ├── setup.ts               # Configuración del proyecto
│   ├── test-utils.ts          # Utilidades para tests
│   └── database/              # Scripts de base de datos
├── tests/                      # Tests (separados del código fuente)
│   ├── unit/                  # Tests unitarios
│   │   └── modules/           # Tests por módulo
│   ├── integration/           # Tests de integración
│   │   └── api/               # Tests de endpoints API
│   └── e2e/                   # Tests end-to-end
├── src/                        # Código fuente
│   ├── app/                   # Next.js App Router
│   ├── components/            # Componentes UI
│   │   ├── ui/               # Componentes base (Shadcn/UI)
│   │   ├── shared/           # Componentes de negocio reutilizables
│   │   └── layout/           # Layouts de la aplicación
│   ├── modules/               # Módulos de negocio (Hexagonal)
│   │   ├── shared/           # Núcleo compartido
│   │   │   ├── domain/       # Value Objects, Entidades comunes
│   │   │   ├── application/  # Casos de uso comunes
│   │   │   └── infrastructure/ # Config base, mappers comunes
│   │   ├── media/            # Bounded Context: Media (Películas, Series, Juegos)
│   │   │   ├── domain/       # Entidades (Media, Stats), Ports
│   │   │   ├── application/  # Casos de uso (TrackMedia, GetRankings)
│   │   │   └── infrastructure/ # Adaptadores (Supabase, TMDB, IGDB)
│   │   ├── social/           # Bounded Context: Social (Amigos, Perfiles)
│   │   │   ├── domain/       # Entidades (User, Friendship)
│   │   │   ├── application/  # Casos de uso (AddFriend, UpdateProfile)
│   │   │   └── infrastructure/ # Adaptadores (SupabaseSocial)
│   │   └── auth/             # Bounded Context: Auth (Login, Register)
│   │       ├── domain/       # Entidades (Session, Token)
│   │       ├── application/  # Casos de uso (SignIn, SignUp)
│   │       └── infrastructure/ # Adaptadores (SupabaseAuth, SendGrid)
│   ├── infrastructure/        # Adaptadores de infraestructura
│   │   ├── email/            # SendGrid, SMTP
│   │   ├── database/         # Supabase, PostgreSQL
│   │   └── external/         # TMDB, IGDB
│   └── types/                # Tipos globales
├── public/                    # Assets estáticos
│   ├── images/
│   └── fonts/
├── .env.local                 # Variables de entorno local
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── postcss.config.mjs
```

### Detalles por Capa

#### 1. Capa de Dominio (`src/modules/*/domain/`)
- **Entidades**: Clases puras con reglas de negocio
- **Value Objects**: Tipos inmutables (Email, UUID, MediaId)
- **Ports**: Interfaces de repositorios y servicios
- **PROHIBIDO**: Importar anything de infraestructura

#### 2. Capa de Aplicación (`src/modules/*/application/`)
- **Caso de Uso**: Lógica de negocio específica
- **Services**: Orquestación de operaciones
- **DTOs**: Objetos de transferencia de datos
- **Depende solo de**: Domain layer y Ports

#### 3. Capa de Infraestructura (`src/modules/*/infrastructure/`)
- **Adaptadores**: Implementaciones de Ports
- **Mappers**: Conversión de datos externos a dominio
- **Clientes**: Conexiones a APIs externas
- **Puede depender de**: Cualquier librería externa

#### 4. Scripts (`scripts/`)
- **TypeScript obligatorio**: No JavaScript
- **Separados del código fuente**: No en `src/`
- **Utilidades**: Setup, migraciones, generación de tipos

#### 5. Tests (`tests/`)
- **Separados del código fuente**: No en `src/modules/*/tests/`
- **Estructura clara**: unit/, integration/, e2e/
- **Independientes**: Pueden ejecutarse sin levantar la app

### Import Rules

#### Imports Permitidos
```
// Domain puede importar solo de sí mismo
import { User } from '@/modules/social/domain/entities/User';

// Application puede importar de Domain
import { SignInUseCase } from '@/modules/auth/application/use-cases/SignInUseCase';

// Infrastructure puede importar de Application y Domain
import { SupabaseAuthRepository } from '@/modules/auth/infrastructure/repositories/SupabaseAuthRepository';
```

#### Imports Prohibidos
```
// ❌ Domain NO puede importar de Infrastructure
import { supabase } from '@/modules/auth/infrastructure/supabase-client';

// ❌ Domain NO puede importar de UI
import { Button } from '@/components/ui/Button';

// ❌ Application NO puede importar de Infrastructure directamente
import { sendGridClient } from '@/infrastructure/email/sendgrid';
```

## Definition of Done (DoD)

Una funcionalidad solo está completa si cumple:

### 1. Entidad (Domain)
- [ ] Tiene reglas de validación en la capa de Domain
- [ ] No depende de infraestructura externa
- [ ] Tiene tests unitarios en `tests/unit/modules/`

### 2. Caso de Uso (Application)
- [ ] Implementado en la capa de Application
- [ ] Usa interfaces (Ports) para dependencias
- [ ] Tiene tests de integración en `tests/integration/`

### 3. Repositorio (Infrastructure)
- [ ] Cumple la interfaz del Domain
- [ ] Tiene mappers para conversión de datos
- [ ] Tiene tests de integración

### 4. UI (Components/App)
- [ ] Usa Optimistic Updates (TanStack Query)
- [ ] Gestiona estados de carga/error
- [ ] Tiene tests E2E en `tests/e2e/`

### 5. Scripts
- [ ] Escrito en TypeScript
- [ ] Ubicado en `scripts/`
- [ ] Documentado en `docs/guides/`

### 6. Tests
- [ ] Separados del código fuente en `tests/`
- [ ] Ejecutables de forma independiente
- [ ] Cubren casos de éxito y error

## Checklist de Reorganización

Cuando se trabaje en reorganizar el proyecto:

- [ ] Mover `AGENTS.md` a `.github/AGENTS.md`
- [ ] Mover `vercel.json` a `.vercel/project.json` o `config/vercel.json`
- [ ] Crear carpeta `scripts/` y migrar scripts JS a TS
- [ ] Crear carpeta `tests/` y mover tests desde `src/`
- [ ] Actualizar imports en todo el proyecto
- [ ] Actualizar `.gitignore` con nuevas rutas
- [ ] Actualizar CI/CD si es necesario
- [ ] Verificar build y tests pasan
- [ ] Actualizar documentación con nueva estructura