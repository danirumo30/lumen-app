# Proposal: Definición de Entidades de Dominio de Media (Película/Serie)

## Intent

Definir las **entidades de dominio base** relacionadas con Media (Película/Serie) como tipos e interfaces puras de TypeScript dentro de `src/modules/shared/domain`, alineadas con Arquitectura Hexagonal y DDD. Esto establece un **lenguaje ubicuo** estable para todo el ecosistema (media, social, estadísticas) sin acoplarse aún a Supabase, Next.js ni proveedores externos (TMDB/IGDB).

## Scope

### In Scope
- Definir el **modelo de identidad** de Media (`MediaId`), incluyendo convenciones para IDs externos (ej. `tmdb_`, `igdb_`).
- Definir la **entidad de dominio** `Media` para Películas y Series (tipo, título, año, duración, estados mínimos).
- Definir los **value objects** básicos relacionados (ej. `MediaType`, `MediaTitle`, `MediaRuntimeMinutes`, `MediaStatus`).
- Definir tipos para los **estados del usuario sobre una media** a nivel de dominio compartido (ej. `UserMediaState` con `isFavorite`, `isWatched`, `planned`, etc.).
- Localizar estas definiciones en `src/modules/shared/domain` para que sean reutilizables por módulos `media` y `social`.

### Out of Scope
- Implementar repositorios, mappers o adaptadores de infraestructura (Supabase, TMDB, IGDB).
- Definir esquemas de tablas concretos en Postgres o políticas RLS.
- Casos de uso de aplicación (ej. `TrackMedia`, `GetRankings`).
- Cualquier lógica de UI, React, Next.js o TanStack Query.

## Approach

- Crear (o extender) el namespace compartido de dominio en `src/modules/shared/domain` con **tipos e interfaces puras** sin dependencias externas.
- Representar **Media** como una entidad inmutable en lo posible (propiedades readonly donde tenga sentido) y con un identificador único `MediaId`.
- Tratar el ID de media como **string tipado** a nivel de dominio (`MediaId`), con convenciones documentadas para prefijos (`tmdb_`, `igdb_`, etc.) pero sin lógica de parsing aún.
- Definir un **tipo discriminado** para diferenciar Películas vs Series (`MediaType = "movie" | "tv"`), manteniendo el dominio preparado para videojuegos en iteraciones futuras.
- Separar claramente:
  - La **descripción global de la media** (`Media`): propiedades estáticas/descriptivas.
  - El **estado de usuario sobre esa media** (`UserMediaState`): flags de tracking (favorito/visto/pendiente), puntuación, progreso.
- Mantener los tipos lo suficientemente genéricos como para mapear respuestas de TMDB/IGDB a estas entidades a través de mappers en `infrastructure` más adelante.

## Affected Areas

| Area                             | Impact     | Description                                                                 |
|----------------------------------|-----------|-----------------------------------------------------------------------------|
| `src/modules/shared/domain/`     | New       | Definición de entidades de dominio compartidas para Media y estados de usuario. |
| `docs/`                          | Modified  | Este `PROPOSAL.md` documenta el lenguaje ubicuo inicial para Media.        |

## Risks

| Risk                                                    | Likelihood | Mitigation                                                                 |
|---------------------------------------------------------|-----------|---------------------------------------------------------------------------|
| Que los tipos iniciales de Media no cubran todos los casos futuros (ej. videojuegos, temporadas, episodios). | Medium    | Diseñar tipos extensibles (ej. campos opcionales, tipos discriminados) y documentar la intención para futuras extensiones. |
| Acoplar demasiado pronto el dominio a un proveedor externo concreto (TMDB vs IGDB). | Low       | Mantener el `MediaId` como string tipado con prefijos, sin exponer campos específicos de un proveedor.       |
| Necesidad de refactor si se deciden métricas diferentes (ej. duración en minutos vs runtime en segundos). | Medium    | Definir value objects (`MediaRuntimeMinutes`) que faciliten refactors posteriores. |

## Rollback Plan

- Si las entidades de dominio propuestas resultan insuficientes o demasiado rígidas, se podrá:
  - Eliminar o refactorizar los tipos introducidos en `src/modules/shared/domain`.
  - Actualizar este `PROPOSAL.md` con una nueva iteración que documente los cambios.
- Dado que aún no habrá código de infraestructura ni casos de uso dependientes, el impacto de rollback es bajo y se limita al dominio compartido.

## Dependencies

- Skill de Arquitectura Hexagonal y DDD (`.gentle-ai/skills/hexagonal-architecture/hexagonal-architecture.md`).
- Stack definido: Next.js (App Router) + TypeScript + Supabase (registrado en Engram).
- Futuras integraciones con TMDB/IGDB que mapearán objetos remotos a estas entidades de dominio.

## Success Criteria

- [ ] Existen tipos e interfaces puras para `MediaId`, `Media`, `MediaType`, `UserMediaState` (y value objects relevantes) en `src/modules/shared/domain` sin dependencias de infraestructura.
- [ ] Los tipos permiten representar al menos Películas y Series con sus atributos básicos (título, año, duración opcional).
- [ ] El modelo de `UserMediaState` soporta estados de tracking mínimos: favorito, visto, pendiente, puntuación opcional.
- [ ] Ningún archivo de dominio importa módulos de Supabase, Next.js o SDKs externos.