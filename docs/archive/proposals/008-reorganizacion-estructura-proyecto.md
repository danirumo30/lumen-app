# 008 - Reorganización de Estructura de Proyecto

## Intent
Reorganizar la estructura de carpetas del proyecto Lumen siguiendo las mejores prácticas de Next.js y arquitectura hexagonal madura, separando código fuente, tests, scripts y documentación según la skill `hexagonal-architecture`.

## Scope
1. **Mover archivos de raíz** a ubicaciones apropiadas (`.github/`, `.vercel/`)
2. **Crear carpeta `scripts/`** para scripts de desarrollo (TypeScript)
3. **Crear carpeta `tests/`** separada del código fuente
4. **Reorganizar `src/`** siguiendo hexagonal architecture estricta
5. **Actualizar configuraciones** (tsconfig, imports, etc.)
6. **Migrar componentes de auth** a módulo `auth/`
7. **Actualizar `.gitignore`** y CI/CD si es necesario

## Approach

### 1. Estructura Objetivo (según skill hexagonal-architecture)

```
lumen-app/
├── .github/                    # Configuración de GitHub
│   └── AGENTS.md              # Configuración del agente
├── .vercel/                    # Configuración de Vercel
│   └── project.json
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
│   │   ├── media/            # Bounded Context: Media
│   │   ├── social/           # Bounded Context: Social
│   │   └── auth/             # Bounded Context: Auth (NUEVO)
│   ├── infrastructure/        # Adaptadores de infraestructura
│   │   ├── email/            # SendGrid, SMTP
│   │   ├── database/         # Supabase, PostgreSQL
│   │   └── external/         # TMDB, IGDB
│   └── types/                # Tipos globales
├── public/                    # Assets estáticos
└── ...
```

### 2. Pasos de Implementación

1. **Mover `AGENTS.md`** → `.github/AGENTS.md`
2. **Crear `scripts/`** y mover archivos JS → TS
3. **Crear `tests/`** estructura completa
4. **Crear módulo `auth/`** en `src/modules/`
5. **Mover componentes de auth** a módulo correspondiente
6. **Actualizar imports** en todo el proyecto
7. **Actualizar configuración** de TypeScript (paths)
8. **Verificar build y tests**

## Affected Areas

- `AGENTS.md` → `.github/AGENTS.md`
- `src/contexts/AuthContext.tsx` → `src/modules/auth/infrastructure/contexts/`
- `src/components/auth/` → `src/modules/auth/ui/`
- `src/app/api/auth/*` → `src/modules/auth/infrastructure/api/`
- Tests actuales → `tests/integration/api/auth/`
- Scripts JS → `scripts/` (TypeScript)

## Risks

1. **Breaking imports**: Rutas de importación pueden romperse
2. **Tests fallando**: Tests pueden necesitar actualizar rutas
3. **Configuración Next.js**: Paths pueden necesitar ajustes
4. **Referencias a rutas antiguas**: Documentación y otros archivos

## Success Criteria

- [x] Estructura de carpetas reorganizada según skill hexagonal-architecture
- [x] Archivos de raíz movidos a ubicaciones apropiadas
- [x] Scripts migrados a TypeScript en `scripts/`
- [x] Tests separados en carpeta `tests/`
- [x] Módulo `auth/` creado en `src/modules/`
- [x] Componentes de auth movidos a módulo correspondiente
- [x] Imports actualizados en todo el proyecto
- [x] Build exitoso
- [x] Tests pasando
- [x] Documentación actualizada

## Estado

⏳ **EN PROCESO** - Implementación en curso