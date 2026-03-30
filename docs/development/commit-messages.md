# Convenciones de Commits

## Conventional Commits

Todos los commits deben seguir el formato:

```
<tipo>(<alcance>): <descripción>

[cuerpo opcional]

[pie opcional]
```

Ejemplo:
```
feat(auth): add custom email verification flow

- Implement token-based verification using email_verifications table
- Add /api/auth/request-verification endpoint
- Add /api/auth/confirm-email endpoint
- Add verification modal UI with simulate button for dev

Closes #123
```

## Tipos

| Tipo | Cuándo usarlo | Genera versión |
|------|----------------|----------------|
| `feat` | Nueva funcionalidad | **Minor** (1.1.0 → 1.2.0) |
| `fix` | Bug fix | **Patch** (1.1.0 → 1.1.1) |
| `break` | Breaking change | **Major** (1.1.0 → 2.0.0) |
| `refactor` | Refactorización sin cambio funcional | No release |
| `docs` | Solo documentación | No release |
| `test` | Tests (añadir, corregir, refactor) | No release |
| `chore` | Build, CI, config cambios | No release |
| `perf` | Mejora de performance | Minor |
| `style` | Formato, whitespace, coma faltante | No release |

## Alcances (Scopes)

Los scopes definidos para Lumen:

- `[auth]` – Autenticación, autorización, sesiones, verificación email, reset password
- `[media]` – Catálogo, discovery, trending, detalles películas/series/juegos
- `[social]` – Perfiles, seguidores, estadísticas, interacciones
- `[shared]` – Domain shared utilities, value objects, errors
- `[arch]` – Arquitectura, estructura de carpetas, patrones
- `[infra]` – Infraestructura: Supabase, TMDB, IGDB, Email services
- `[ui]` – Componentes React, Tailwind, shadcn/ui, estilos
- `[tests]` – Unit, integration, e2e tests
- `[ci]` – CI/CD, GitHub Actions, workflows, scripts de build
- `[deps]` – Dependencias npm (update, add, remove)
- `[docs]` – README, ADRs, guías, comentarios de código

## Formato de Descripción

- **Máximo 50 caracteres**
- **Imperativo, presente**: "add", "fix", "remove", "refactor"
- **No punto al final** (a menos que sea necesario por punto)
- **Minúscula inicial**
- **Específico**: no "fix bug", sino "fix login validation error"

✅ Correctos:
- `feat(auth): add email verification modal`
- `fix(media): correct movie genre parsing from TMDB`
- `refactor(arch): move repositories to infrastructure layer`

❌ Incorrectos:
- `feat: added email verification` (sin scope)
- `fix(auth): fixed the bug` (no específico)
- `breaking change: rename API endpoints` (usar `break` tipo)

## Breaking Changes

Si el commit introduce incompatibilidad hacia atrás:

``` 
feat(api)!: rename user media endpoints

BREAKING CHANGE:
/api/user/tv-status → /api/v1/user/media/tracking
/api/user/movie-favorite → /api/v1/user/media/favorites

Update your client code accordingly. Legacy endpoints removed.

Closes #456
```

Note el `!` después del tipo. También agregar sección `BREAKING CHANGE:` en cuerpo con explicación y migración.

## Cuerpo del Commit (Opcional pero Recomendado)

Para commits no triviales, explicar **qué** y **por qué**.

Formato:

```
<tipo>(<scope>): <subject>

Cuerpo explicando:
- Qué cambios se realizaron
- Por qué se tomaron estas decisiones
- Impacto en otras partes del sistema
- Cómo probar los cambios

Referencias: Closes #123, Refs #456
```

Ejemplo:
```
fix(auth): prevent duplicate email registration

El sistema permitía registrar dos usuarios con el mismo email porque
el unique constraint en DB no se verificaba antes del insert.

Cambios:
- IUserRepository.exists() ahora checkea email + username
- RegisterCommand validaunicidad antes de crear User entity
- Api route devuelve 409 Conflict si ya existe

Tests: RegisterCommandHandler.test AlreadyExists coverage added.

Closes #89
```

## Referencias de Issues

- `Closes #123` – Cierra issue cuando el commit se mergea
- `Fixes #123` – Similar a Closes
- `Refs #123` – Menciona issue sin cerrar
- `Related to #123` – Relacionado

## Rebase vs Merge

Preferimos **rebase** para mantener historial lineal:

```bash
git checkout feature-branch
git rebase main
git push --force-with-lease
```

Luego **squash merge** en main:

```bash
git checkout main
git merge --squash feature-branch
git commit -m "feat(auth): add custom email verification"
```

O merge commits individuales si cada commit es significativo.

## Hooks de Commit (Husky + Commitlint)

### Configuración commitlint

```json
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', [
      'auth', 'media', 'social', 'shared', 'arch',
      'infra', 'ui', 'tests', 'ci', 'deps', 'docs'
    ]],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-full-stop': [2, 'never', '.'],
    'subject-empty': [2, 'never'],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

### Husky pre-commit hook

```bash
npx husky add .husky/commit-msg 'npx --no-install commitlint --edit $1'
```

## Gitmoji (Opcional)

Si prefieres emojis (no requerido en Lumen):

```
✨ feat: new feature
🐛 fix: bug fix
♻️ refactor: restructuring
📚 docs: documentation
✅ test: tests
🍱 chore: maintenance
⚡ perf: performance
🔧 chore: config/build
🚀 deploy: deployment
💥 break: breaking change
```

Pero creemos más claro Conventional Commits sin emojis.

## Ejemplos Completos

### Nueva Feature

```
feat(media): add trending movies carousel

- Create TrendingMoviesCarousel component with TMDB trending API
- Add query hook useTrendingMovies(period: 'day'\|'week')
- Implement infinite scroll with pagination
- Add skeleton loading state
- Update discover page layout

Closes #205
```

### Bug Fix

```
fix(auth): correct email verification not updating isVerified flag

The verification token endpoint was updating email_verified_at but not the
is_verified boolean on users table. This caused login to fail despite
verification email working.

Now both fields are updated atomically in one transaction.

Also add test to verify both fields updated.

Fixes #89
```

### Refactor

```
refactor(arch): separate UserMediaState from User aggregate

Moved UserMediaState from src/domain/auth/entities/ to
src/domain/media/entities/ because tracking belongs to media context,
not auth. Updated all repositories and queries accordingly.

BREAKING CHANGE: UserMediaState is now in media context.
Import paths changed:
`@/domain/auth/entities/user-media-state` → `@/domain/media/entities/user-media-state`

Update your imports or run codemod script.

Closes #234
```

### Chore

```
chore(deps): update Next.js to 16.1.6 and React 19.2.3

Also update @tanstack/react-query to v5.90.21.

No breaking changes detected.
```

### Test

```
test(media): add edge cases for UserMediaState validation

- Test that platinum requires watched
- Test that only one status flag allowed
- Test progress negative throws
- Improve coverage to 95%

No functional changes.
```

### Docs

```
docs(overview): add request flow diagram and bounded contexts explanation

- Added mermaid diagram showing UI → App → Domain → Infra flow
- Documented all bounded contexts with responsibilities
- Added cross-context event communication section

Docs only, no code changes.
```

## Scripts Útiles

```json
{
  "scripts": {
    "commit": "git-cz",  // si usas commitizen
    "changelog": "conventional-changelog -p eslint -i CHANGELOG.md -s",
    "bump": "standard-version"  // automágico semver + changelog
  }
}
```

## Checklist Pre-commit

- [ ] Tests pasando (`npm test`)
- [ ] Lint limpio (`npm run lint`)
- [ ] Type-check OK (`npm run type-check`)
- [ ] Mensaje de commit sigue Conventional Commits
- [ ] Si es breaking change, agregar `!` y `BREAKING CHANGE:`
- [ ] Si cierra issue, agregar `Closes #123`
- [ ] No commitear secrets (usar `git-secrets` o `detect-secrets`)

---

**Próximo**: Volver al [README.md](../README.md) para actualizarlo con la nueva arquitectura documentada
