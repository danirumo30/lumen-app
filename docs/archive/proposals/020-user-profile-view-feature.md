# Proposal: User Profile View Feature (TV Time Style)

## Intent

Implementar una **página de perfil de usuario** al estilo TV Time que muestre la información pública del usuario, estadísticas de consumo de media, y sus listas de contenido. La página tendrá:

1. **Vista de perfil** con:
   - Foto de perfil (avatar)
   - Banner de fondo
   - Nombre de usuario (username)
   - Estadísticas de seguidores/seguidos
   - Tiempo total visualización: series, películas, videojuegos

2. **Pestañas/secciones** para:
   - Series vistas
   - Series favoritas
   - Películas vistas
   - Películas favoritas
   - Videojuegos jugados
   - Videojuegos favoritos

3. **Funcionalidad de edición**:
   - Botón "Editar perfil" que lleve a `/profile/edit`
   - Página de edición con campos: foto de perfil, banner, username
   - Mantener la seguridad y validación de datos

El objetivo es proporcionar una experiencia de usuario rica y visualmente atractiva para el perfil social de Lumen, similar a plataformas de tracking de media como TV Time.

## Scope

### In Scope
- Página de perfil pública (`/profile/[username]`) con:
  - Header con banner y avatar
  - Información básica (username, estadísticas de seguidores)
  - Estadísticas de tiempo de consumo (series, películas, videojuegos)
  - Tabs/secciones para diferentes tipos de contenido
  - Listas de contenido favorito y visto

- Página de edición de perfil (`/profile/edit`) con:
  - Campos editables: avatar, banner, username
  - Validación de datos
  - Actualización optimista de la UI

- Componentes UI reutilizables:
  - ProfileHeader
  - ProfileStats
  - MediaGrid
  - MediaCard

- Integración con el sistema de tracking existente:
  - Consulta de estadísticas de usuario
  - Filtrado de contenido por tipo y estado (favorito, visto)
  - Uso de la vista `user_global_stats`

### Out of Scope
- Sistema de seguimiento de usuarios (followers/following) - se implementará en otra propuesta
- Comentarios o interacciones sociales en el perfil
- Configuración avanzada de privacidad
- Exportación de datos
- Gamificación/badges visibles en el perfil (se implementará en otra propuesta)

## Approach

### 1. Estructura de Rutas Next.js

```
/app/
  profile/
    [username]/
      page.tsx        # Vista de perfil público
    edit/
      page.tsx        # Página de edición de perfil
```

### 2. Dominios y Entidades

Extender el dominio existente `UserProfile` para incluir estadísticas completas:

```typescript
// src/modules/social/domain/user-profile.ts
export interface UserProfileWithContent extends UserProfileWithStats {
  readonly favoriteMovies: Media[];
  readonly watchedMovies: Media[];
  readonly favoriteTvShows: Media[];
  readonly watchedTvShows: Media[];
  readonly favoriteGames: Media[];
  readonly watchedGames: Media[];
}

export interface UserProfileContentQuery {
  readonly userId: string;
  readonly includeFavorites: boolean;
  readonly includeWatched: boolean;
  readonly mediaTypes: MediaTypeForStats[];
}
```

### 3. Repositorios y Servicios

**UserProfileRepository** (nuevo):
- `getProfileByUsername(username: string): Promise<UserProfileWithStats | null>`
- `getProfileContent(query: UserProfileContentQuery): Promise<UserProfileWithContent>`
- `updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile>`

**UpdateProfileData**:
```typescript
interface UpdateProfileData {
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  username?: string;
}
```

### 4. UI Components

**ProfilePage** (`/app/profile/[username]/page.tsx`):
- Server Component que obtiene datos del perfil
- Client Component para la interactividad de tabs

**ProfileHeader**:
- Banner de fondo (con fallback gradient)
- Avatar circular
- Username y estadísticas básicas

**ProfileStats**:
- Grid con métricas de tiempo total
- Iconos para cada categoría (series, películas, videojuegos)

**MediaTabs**:
- Tabs para filtrar contenido: Series, Películas, Videojuegos
- Sub-tabs para "Vistos" vs "Favoritos"

**MediaGrid**:
- Grid responsive de tarjetas de media
- Cada tarjeta muestra: imagen, título, año, rating (si existe)

### 5. Optimización y Caching

- Usar TanStack Query para el cliente:
  - `useProfileQuery(username)`
  - `useProfileContentQuery(userId, filters)`
  - `useUpdateProfileMutation()`

- Server-side prefetching para datos iniciales

- Optimistic Updates en la edición de perfil:
  1. Actualizar UI inmediatamente
  2. Enviar petición al servidor
  3. Rollback en caso de error

### 6. Seguridad y Validación

- **RLS (Row Level Security)** en Supabase:
  - Perfiles públicos visibles para todos
  - Solo el usuario dueño puede editar su perfil

- **Validación de username**:
  - Longitud mínima/máxima
  - Caracteres permitidos (alphanuméricos, guiones bajos)
  - Unicidad global

- **Validación de URLs**:
  - Formato URL válido
  - Tamaño máximo de imagen (client-side validation)

### 7. Estilos y Diseño

- Usar Tailwind CSS con el preset de Shadcn/UI
- Diseño responsivo (mobile-first)
- Animaciones sutiles para tabs y hover states
- Tema oscuro como base

## Affected Areas

### Código Existente
- **`src/modules/social/domain/user-profile.ts`**: Extender con nuevas interfaces
- **`src/modules/auth/domain/user.entity.ts`**: Posible extensión si se requiere más info de usuario
- **`src/modules/media/domain/user-media.repository.ts`**: Consultas de contenido

### Nueva Infraestructura
- **Repositorios**: `UserProfileRepository` en `src/modules/social/infrastructure/repositories/`
- **Mappers**: `UserProfileMapper` para conversión de datos de Supabase
- **API Routes**: `/api/profile/[username]`, `/api/profile/edit`
- **Components**: `src/components/profile/` con subcomponentes

### Base de Datos
- No requiere cambios en esquema existente
- Uso de vistas existentes: `user_global_stats`
- Consultas a `user_media_tracking` para contenido favorito/visto

## Risks

1. **Performance**: Consultas de múltiples tablas pueden ser lentas
   - *Mitigación*: Usar vistas materializadas o índices apropiados en Supabase

2. **Seguridad**: Exposición de información de usuario
   - *Mitigación*: RLS estricto, solo datos públicos visibles

3. **Validación de username**: Colisiones en usernames únicos
   - *Mitigación*: Sistema de sufijos aleatorios (ya implementado en propuesta 002)

4. **Tamaño de imágenes**: Banner y avatar pueden ser pesados
   - *Mitigación*: Validación de tamaño en client-side, optimización en Supabase Storage

5. **Responsive design**: Complejidad en layout para diferentes tamaños
   - *Mitigación*: Mobile-first approach, testing en múltiples dispositivos

## Success Criteria

1. **Funcionalidad**:
   - [ ] Página de perfil pública accesible via `/profile/[username]`
   - [ ] Mostrar avatar, banner, username correctamente
   - [ ] Mostrar estadísticas de tiempo de consumo
   - [ ] Tabs funcionales para filtrar contenido por tipo y estado
   - [ ] Página de edición accesible via `/profile/edit`
   - [ ] Actualización exitosa de perfil con optimismo UI

2. **Performance**:
   - [ ] Tiempo de carga < 2 segundos para perfil
   - [ ] Lazy loading de imágenes en grids de contenido
   - [ ] Caching adecuado con TanStack Query

3. **Seguridad**:
   - [ ] Solo dueño puede editar su perfil
   - [ ] Datos privados no expuestos en perfiles públicos
   - [ ] Validación de entrada robusta

4. **UX/UI**:
   - [ ] Diseño consistente con TV Time
   - [ ] Animaciones fluidas
   - [ ] Totalmente responsivo
   - [ ] Accesibilidad (ARIA labels, keyboard navigation)

5. **Code Quality**:
   - [ ] Tests unitarios para lógica de dominio
   - [ ] Tests de integración para API endpoints
   - [ ] Sin warnings de TypeScript
   - [ ] Coverage mínimo del 70%

## Implementation Plan

### Fase 1: Backend (Día 1-2)
1. Extender dominio `UserProfile`
2. Implementar `UserProfileRepository`
3. Crear mappers para conversión de datos
4. Implementar API endpoints

### Fase 2: Frontend - Vista (Día 3)
1. Crear estructura de rutas
2. Implementar `ProfilePage` Server Component
3. Crear componentes base: ProfileHeader, ProfileStats

### Fase 3: Frontend - Contenido (Día 4)
1. Implementar MediaTabs con filtrado
2. Crear MediaGrid y MediaCard
3. Integrar TanStack Query

### Fase 4: Edición de Perfil (Día 5)
1. Crear página `/profile/edit`
2. Implementar formularios con validación
3. Optimistic updates y error handling

### Fase 5: Testing y Polish (Día 6)
1. Tests unitarios e integración
2. Refinamiento de UI/UX
3. Performance optimization
4. Documentation

### Fase 6: Despliegue (Día 7)
1. Code review
2. Security review
3. Despliegue a Preview
4. Merge a main

---

**Propuesta creada por:** Agente IA
**Fecha:** 2026-03-17
**Estado:** Draft (requiere revisión humana)
