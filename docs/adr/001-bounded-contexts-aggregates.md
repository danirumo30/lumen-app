# ADR 001: Bounded Contexts and Aggregates

**Status:** Accepted  
**Date:** 2026-03-29  
**Commit:** 957959f  

---

## Context

Lumen-app es una aplicación de seguimiento de medios (TV, películas, juegos) con sociales. Necesitamos definir bounded contexts y aggregates para aplicar Clean Architecture + DDD.

---

## Decision

### Bounded Contexts

1. **Auth Context** – Autenticación, autorización, sesiones, verificación de email, reseteo de contraseña.
   - Responsabilidad: Gestionar identidad y acceso
   - Equivalente a módulo: `src/modules/auth/`

2. **Media Context** – Catálogo, descubrimiento, detalles, tendencias de contenido (TV, películas, juegos, episodios).
   - Responsabilidad: Proveer información y seguimiento de medios
   - Equivalente: `src/modules/media/`

3. **Social Context** – Perfiles de usuario, seguidores, estadísticas sociales.
   - Responsabilidad: Gestionar interacciones sociales y grafos de usuario
   - Equivalente: `src/modules/social/`

4. **Shared Context** – Value objects, errores, utilidades comunes.
   - Responsabilidad: Componentes reutilizables entre contexts
   - Equivalente: `src/modules/shared/`

### Aggregates

#### Auth Context
- **User** (Aggregate Root)
  - Identidad única (email, username)
  - Atributos: email, username, fullName, avatarUrl, isVerified, isActive
  - Hijos:
    - `UserProfile` (parte del mismo aggregate, persistido junto)
    - `UserMediaTracking` (colección de estados de seguimiento, parte del aggregate User)
    - `UserSettings` (configuraciones)
  - Invariante: Solo el root User se referencia desde fuera. Repositorio `UserRepository` devuelve/acepta `User` completo con sus hijos.

#### Media Context
- **Media** (Aggregate Root)
  - Contiene colecciones de: `Tv`, `Movie`, `Game`, `Episode`
  - Cada tipo es una entidad hija con identidad propia (mediaId: `tmdb_123` o `igdb_456`)
  - Hijos no se acceden directamente; se accede a través del root `Media` (o repositories específicos que devuelven Media aggregates)
  - Nota: Para optimización, podemos tener repositorios que devuelvan solo el tipo específico (ej. `TvRepository.find(id)` devuelve `Tv` pero internamente es parte del aggregate Media)
  - **Alternativa considerada**: Separar en aggregates independientes por tipo. Rechazada porque hay invariants cruzados (ej. popularidad, contenido adulto) y queries cruzadas. Mejor un solo aggregate con boundaries claros: cada tipo se maneja independiente pero dentro del mismo contexto.

#### Social Context
- **UserProfile** (Aggregate Root)
  - Alguna vez pensamos que era parte de User aggregate, pero está en Social context.
  - Decision: UserProfile es **separate aggregate** (no pertenece a User).
  - Relationship: User tiene ID; Social context referencia User por ID.
  - Atributos: username, avatarUrl, bio, isPublic, stats (totalMovies, totalSeries, followersCount, followingCount)
- **Follow** (Entity)
  - Relación de seguimiento entre usuarios (followerId → followingId)
  - Pertenece al aggregate UserProfile? No, Follow es su propio aggregate o parte de un Graph aggregate. Para simplicidad, Follow es entidad independiente con repository `FollowRepository`.

### Value Objects Identificados

- **Email** – Validación regex, normalización (lowercase)
- **Username** – Longitud 3-30, caracteres alfanuméricos + guiones
- **FullName** – Trim, longitud mínima 1, max 100
- **Password** – Hash (bcrypt/argon2), nunca almacenar plain
- **MediaId** – Wrap string `tmdb_123`, `igdb_456`, validar tipo
- **TrackingStatus** – Enum: `WATCHED`, `FAVORITE`, `PLANNED` (para user media tracking)
- **EntityId** – Base class para IDs de aggregates

---

## Consequences

### Positivas
- Límites claros entre contextos
- Comunicación via domain events (cross-context eventual consistency)
- Repositorios por aggregate, no por tabla
- Dominio puro sin dependencias externas

### Negativas
- Complejidad inicial erhöht
- Need para event bus y subscribers
- Máxima disciplina en imports

---

## Implementation Notes

1. **UserProfile location**: Aunque User y UserProfile están alfabéticamente cerca, deben estar en contextos separados: `domain/auth/entities/user.entity.ts` y `domain/social/entities/user-profile.entity.ts`
2. **UserMediaTracking**: Pertenece al aggregate User (en `domain/auth/entities/user-media-state.entity.ts`). Se persiste junto con User o en tabla separada pero con la misma transacción.
3. **Media type entities**: Cada tipo (Tv, Movie, Game, Episode) es una entidad con interfaz común `MediaItem`. No serán clases separadas de aggregate root; el root `Media` las contiene.
4. **Follow**: Se puede modelar como valor en una lista de seguidores dentro de UserProfile (mejor) o como entidad separada. Inicialmente, lo metemos como hijo de UserProfile (colección de IDs) para mantener simple.

---

## References

- Clean DDD Hexagonal skill: Aggregate boundaries, "One aggregate per transaction"
- Domain-Driven Design (Blue Book) – Evans, 2003
