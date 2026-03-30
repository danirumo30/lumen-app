# CHANGELOG

## [Unreleased]

### Added
- Arquitectura Clean + DDD + Hexagonal completamente documentada
- ADRs: 001-007 (bounded contexts, layers, VOs, repositories, events, CQRS, migration)
- Guías de desarrollo: coding conventions, testing, commit messages
- Diagramas de arquitectura en Mermaid
- README actualizado con stack y estructura

### Changed
- Migración completada de `src/modules/` a `src/domain/`, `src/application/`, `src/infrastructure/`
- Todos los tests unitarios funcionando (133 passed)
- TypeScript compilation OK (0 errores)
- Package.json scripts documentados

### Known Issues
- 1 integration test falla (`auth-trigger.test.ts`) – stats aggregation issue
- 42 lint errors (algunos en archivos legacy de `.agents/skills/`, `scripts/` y tests)
- Some domain entities still use `any` in tests (work in progress)

## [1.1.0] – 2026-03-29

### Added
- Complete code quality overhaul (Batch 1-6)
- Custom email verification system replacing Supabase auto-confirmation
- Supabase migrations: `email_verifications` table, `verify_email_token()` function
- API endpoints: `/api/auth/request-verification`, `/api/auth/confirm-email`, `/api/auth/simulate-verification`
- Dev simulation button for email verification
- Session management improvements
- Internationalization support (translate.ts)
- Dark mode ready with Tailwind v4

### Changed
- Supabase Auth: disabled email confirmations in favor of custom flow
- Migration: Moved from `src/modules/` monolith to Clean Architecture layers
- Repository pattern: One repo per aggregate, not per table
- API structure: Split into `auth/`, `media/`, `social/` contexts
- Frontend: shadcn/ui components + Tailwind CSS v4

### Fixed
- Email verification errors and duplicate email bug
- 404 issues during auth flow
- Ambiguous SQL queries in Supabase adapters
- Security concerns with email verification tokens

### Security
- Service Role Key restricted to server-side only
- JWT secret rotation capability
- Rate limiting on auth endpoints

## [1.0.0] – 2025-12-XX

### Added
- Initial release
- Basic auth (login, register) with Supabase Auth
- Movie/TV/Game discovery via TMDB/IGDB
- User profiles and basic social features
- Trending pages, rankings, search

---

**Legend**:
- `[Unreleased]` – Cambios no releasados aún
- `Added` – Nuevas características
- `Changed` – Modificaciones existentes
- `Fixed` – Bug fixes
- `Security` – Vulnerabilities parcheadas
- `Removed` – Features eliminados ( breaking changes )

**Formato**: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
