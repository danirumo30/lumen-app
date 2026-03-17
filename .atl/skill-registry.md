# Skill Registry - Lumen App

## Project Skills (`.gentle-ai/skills/`)

| Skill | Description |
|-------|-------------|
| `clean-code` | Clean Code principles and patterns |
| `email-and-password-best-practices` | Email/password auth best practices |
| `frontend-design` | Frontend design patterns and UI/UX |
| `hexagonal-architecture` | Hexagonal Architecture (Ports & Adapters) |
| `supabase-postgres-best-practices` | Supabase + Postgres best practices |
| `tanstack-query-best-practices` | TanStack Query patterns (optimistic updates, caching) |
| `typescript-expert` | TypeScript expert patterns |
| `webapp-testing` | Testing patterns for web apps |

## Global Skills (`~/.config/opencode/skills/`)

| Skill | Description |
|-------|-------------|
| `sdd-init` | Initialize SDD context |
| `sdd-explore` | Explore and investigate ideas |
| `sdd-propose` | Create change proposal |
| `sdd-spec` | Write specifications |
| `sdd-design` | Create technical design |
| `sdd-tasks` | Break down into tasks |
| `sdd-apply` | Implement tasks |
| `sdd-verify` | Verify implementation |
| `sdd-archive` | Archive completed change |

## Project Conventions

- **AGENTS.md:** `.github/AGENTS.md` - Staff Engineer playbook
- **Proposals:** `docs/proposals/XXX-feature-name.md`
- **Features:** `docs/features/XXX-feature-name.md`

## Rules

1. Always use Conventional Commits (`feat:`, `fix:`, `refactor:`)
2. No direct pushes to main - use feature branches
3. Proposal-first development for structural changes
4. Zero pollution: domain logic separated from infrastructure
