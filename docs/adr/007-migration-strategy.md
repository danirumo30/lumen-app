# ADR 007: Migration Strategy from `src/modules/` to Clean Structure

**Status:** Completed  
**Date:** 2026-03-29  
**Commit:** 957959f  

---

## Context

El proyecto originalmente usaba estructura monolítica en `src/modules/` con carpetas por feature (auth, media, social) que mezclaban domain, application, infrastructure en una misma carpeta. Se decidió migrar a Clean Architecture (domain/application/infrastructure separados) para mejorar maintainability y testability.

## Decision

### Migración por Batches (Fases)

Dividida en 7 batches para minimizar riesgos y mantener build funcionando:

#### Batch 1: Domain Layer Creation
- Crear nueva estructura `src/domain/` con subcarpetas por contexto
- Mover solo código puro de dominio (entities, VOs, repository ports, domain services, events)
- Validar: `tsc --noEmit` sin errores, domain tests unitarios corriendo

#### Batch 2: Application Layer Extraction
- Crear `src/application/` con commands/queries/ports
- Mover use cases de `src/modules/*/application/use-cases/`
- Actualizar imports en API routes (usarán handlers de application)
- Validar: API routes still work

#### Batch 3: Infrastructure Layer Reorganization
- Crear `src/infrastructure/` con subcarpetas por tipo (persistence, external, http, react-query, hooks)
- Mover repositorios Supabase a `infrastructure/persistence/supabase/`
- Mover clients TMDB/IGDB a `infrastructure/external/`
- Mover middleware a `infrastructure/http/middleware/`
- Mover hooks de `src/modules/*/infrastructure/hooks/` a `infrastructure/hooks/` o `react-query/hooks/`

#### Batch 4: Utilities Cleanup
- Mover archivos de `src/lib/` a:
  - `src/shared/` (get-base-url, logger, platforms, translate)
  - `src/infrastructure/http/` (api-response, errors)
  - `src/domain/shared/` (si son domain errors)
  - `src/infrastructure/supabase/` (client)
- Actualizar imports globalmente

#### Batch 5: Domain Enrichment
- Agregar Value Objects faltantes (EmailVO, UsernameVO, etc.)
- Refactorizar Entities para encapsular invariantes (métodos de dominio)
- Implementar factories `fromDatabase`, `toPlainObject`
- Agregar tests de invariantes

#### Batch 6: API Routes Refactoring
- Renombrar y reorganizar API routes opcionalmente
- Cambiar a versioning: `/api/v1/...` (decisión futura)
- Unificar endpoints duplicados (status vs favorite)
- Asegurar que cada route usa command/query handlers (no direct repository)

#### Batch 7: Testing, Documentation & Cutover
- Actualizar tests unitarios (imports a nueva estructura)
- Ejecutar todos los tests (unit, integration, e2e)
- Actualizar documentación (README, ADRs, architecture docs)
- Eliminar `src/modules/` completamente
- Validar build y deploy

### Herramientas de Migración

#### Script Automatizado (Node.js)

```javascript
// scripts/migrate-to-clean-architecture.js
const fs = require('fs');
const path = require('path');

const moves = [
  // { from: 'src/modules/auth/domain', to: 'src/domain/auth' },
  // { from: 'src/modules/auth/application', to: 'src/application/auth' },
  // ...
];

function moveDir(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.renameSync(from, to);
  console.log(`✅ ${from} → ${to}`);
}

// Batch por batch
moves.forEach(move => moveDir(move.from, move.to));
```

#### Actualización Masiva de Imports con Codemod

Usar `jscodeshift` o `ts-morph` para reescribir imports:

```typescript
// Transform: "@/modules/auth/domain/user.entity" → "@/domain/auth/entities/user.entity"
import { createBuilder } from 'ts-morph';

const project = createBuilder()
  .addSourceFilesAtPaths(['src/**/*.ts', 'src/**/*.tsx']);

project.getSourceFiles().forEach(sf => {
  sf.getImportDeclarations().forEach(imp => {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier.includes('@/modules/')) {
      const newSpecifier = moduleSpecifier
        .replace('@/modules/auth/domain/', '@/domain/auth/')
        .replace('@/modules/auth/application/', '@/application/auth/')
        // ... más rules
      ;
      imp.setModuleSpecifier(newSpecifier);
    }
  });
});

project.save();
```

### Checklist de Validación por Batch

- [ ] TypeScript compilation OK (`npx tsc --noEmit`)
- [ ] Lint passing (`npm run lint`)
- [ ] Unit tests passing (`npm run test:unit`)
- [ ] Integration tests passing (`npm run test:integration`)
- [ ] E2E tests passing (opcional por batch, full suite al final)
- [ ] Build successful (`npm run build`)
- [ ] No imports residuales a `src/modules/` (grep en todo src/)

### Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Break imports masivos | Usar codemods automáticos + revision manual de hot spots |
| Ciclos de dependencia | `madge --circular src/` en CI |
| Pérdida de funcionalidad | Tests de integración/E2E después de cada batch |
| Regresiones en producción | Feature flags, rocky rollout, rollback plan |
| Tiempo de migración alto | Batches pequeños, commit por batch |

### Estado Final Esperado

```
src/
├── domain/
│   ├── auth/
│   ├── media/
│   ├── social/
│   └── shared/
├── application/
│   ├── auth/
│   ├── media/
│   ├── social/
│   └── shared/
├── infrastructure/
│   ├── persistence/
│   ├── external/
│   ├── http/
│   ├── react-query/
│   └── hooks/
├── shared/
│   ├── get-base-url.ts
│   ├── logger.ts
│   ├── platforms.ts
│   └── translate.ts
├── types/
│   ├── supabase.ts
│   ├── tmdb/
│   └── igdb/
├── components/
└── app/
```

### Rollback Plan

Si un batch rompe el build:
1. Git revert al último commit válido
2. Analizar error
3. Fix en batch anterior o postergar hasta después
4. Continuar desde batch anterior

### Cronograma (Ejemplo)

- Día 1: Batch 1 (Domain) + tests
- Día 2: Batch 2 (Application) + tests
- Día 3: Batch 3 (Infrastructure) + integration tests
- Día 4: Batch 4 (Utilities) + lint/type-check
- Día 5: Batch 5 (Domain enrichment) + unit tests
- Día 6: Batch 6 (API refactoring) + e2e tests smoke
- Día 7: Batch 7 (Documentation, cleanup, full test suite)

---

**Conclusión**: La migración se completó exitosamente el 2026-03-29. Estructura actual sigue Clean Architecture. `src/modules/` eliminado.
