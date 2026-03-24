# Proposal: 028 - Search & Discover (Unified)

## Intent

Implementar una página unificada `/discover` que combine búsqueda activa y exploración pasiva en una sola experiencia. Los usuarios pueden buscar específicamente (Search) o explorar sin saber qué buscan (Discover), todo desde la misma interfaz.

## Scope

### In Scope
- **Página única `/discover`**: Unifica search + explore
- **Modo search**: Con typing, búsqueda en tiempo real (TMDB + IGDB + Usuarios)
- **Modo discover**: Sin typing, muestra tendencias/populares por categoría
- **Selector de tipo (chips)**: Todo | Películas | Series | Juegos | Usuarios
- **Filtros avanzados por categoría**:
  - Películas: género, año, rating, proveedor de streaming
  - Series: género, año, status, proveedor
  - Juegos: género, plataforma, año, rating
- **Ordenamiento**: Relevancia, rating, año, popularidad
- **Resultados en tiempo real**: Debounce 300ms
- **Historial de búsquedas**: Guardar últimas 10 búsquedas del usuario
- **Rankings**: Página `/rankings` independiente para global/categoría

### Out of Scope
- Búsqueda avanzada con boolean operators
- Recomendaciones personalizadas basadas en ML
- Rankings semanales/mensuales
- Exportar rankings a CSV/PDF
- Modo "explorar" en tiempo real (trending animated)

## Design Specification

### Aesthetic Direction
- **Estilo**: Dark refined minimal con acentos vibrantes por tipo
- **Tema**: Noir cinema con destellos de color
- **Diferenciación**: Glassmorphism sutil + gradientes cromáticos

### Color Palette
```css
--bg-primary: #09090b;        /* Zinc 950 - negro profundo */
--bg-secondary: #18181b;      /* Zinc 900 */
--bg-card: #27272a;          /* Zinc 800 con transparencia */
--text-primary: #fafafa;      /* Zinc 50 */
--text-secondary: #a1a1aa;    /* Zinc 400 */
--text-muted: #71717a;        /* Zinc 500 */

/* Colores por tipo de media */
--color-movie: #f59e0b;       /* Amber 500 - dorado cinema */
--color-tv: #06b6d4;          /* Cyan 500 */
--color-game: #8b5cf6;        /* Violet 500 */
--color-user: #10b981;        /* Emerald 500 */
--color-error: #ef4444;        /* Red 500 */
```

### Typography
- **Display**: "Outfit" o similar con personalidad (evitar Inter/Roboto)
- **Body**: "DM Sans" - legible, moderno
- **Monospace**: "JetBrains Mono" para datos/números

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo + Nav (Home, Discover, Rankings, Profile)   │
├─────────────────────────────────────────────────────────────┤
│  SEARCH BAR                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 [Buscar películas, series, juegos, usuarios...] │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  TYPE CHIPS (sticky)                                       │
│  [Todo] [🎬 Películas] [📺 Series] [🎮 Juegos] [👤 Usuarios]│
├─────────────────────────────────────────────────────────────┤
│  FILTER BAR (collapsible when "Todo")                     │
│  Género ▼  Año ▼  Plataforma ▼  Ordernar: ▼              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONTENT GRID                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │  Card  │ │  Card  │ │  Card  │ │  Card  │ │  Card  │   │
│  │  Movie │ │  Movie │ │   TV   │ │  Game  │ │  User  │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component States

**Search Bar**:
- Default: "Buscar películas, series, juegos, usuarios..." (placeholder)
- Focus: Borde brillante, expand-width animation
- Loading: Spinner interno + resultados parciales
- Error: Borde rojo + mensaje

**Type Chips**:
- Inactive: Fondo transparente, borde sutil
- Active: Fondo con color del tipo, texto blanco
- Hover: Escala 1.02 + glow

**Cards**:
- Hover: Translate-Y -4px, shadow增大, border-color brighten
- Loading: Skeleton pulse animation

### Animations
- **Page load**: Staggered fade-in (50ms delay por item)
- **Filter toggle**: Smooth height transition (200ms)
- **Card hover**: Scale + shadow (150ms ease-out)
- **Search results**: Crossfade (100ms)

### Responsive Breakpoints
- **Mobile** (<640px): 2 columnas, filtros en drawer
- **Tablet** (640-1024px): 3 columnas, filtros inline
- **Desktop** (>1024px): 4-5 columnas, sidebar filtros

## Architecture

### Data Flow
```
User types query ──300ms debounce──> /api/search
                              │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
    TMDB (movie/tv)      IGDB (games)         Supabase (users)

User clears query ──> /api/trending ──> Discover mode
```

### API Endpoints

#### GET /api/search?q={query}&type={type}&filters={json}
- `type`: all | movie | tv | game | user
- `filters`: JSON con parámetros específicos por tipo

#### GET /api/discover?type={type}&filters={json}
- Sin query, devuelve tendencias/populares

#### GET /api/search-history
- Devuelve últimas 10 búsquedas del usuario

#### POST /api/search-history
- Guarda una búsqueda

### UI Components

```
src/app/discover/page.tsx              # Página principal
src/app/rankings/page.tsx               # Página de rankings
src/app/api/search/route.ts            # API búsqueda
src/app/api/discover/route.ts          # API tendencias
src/app/api/search-history/route.ts   # API historial
src/app/api/rankings/route.ts          # API rankings
src/components/discover/
├── DiscoverSearchBar.tsx              # Barra de búsqueda
├── DiscoverTypeChips.tsx              # Chips de tipo
├── DiscoverFilters.tsx                # Filtros avanzados
├── DiscoverGrid.tsx                   # Grid de resultados
├── DiscoverCard.tsx                   # Card base
├── MovieDiscoverCard.tsx              # Card película
├── TvDiscoverCard.tsx                 # Card serie
├── GameDiscoverCard.tsx               # Card juego
├── UserDiscoverCard.tsx               # Card usuario
└── DiscoverSkeleton.tsx                # Skeleton loader
src/components/rankings/
├── RankingsPage.tsx
├── GlobalRanking.tsx
├── CategoryRanking.tsx
└── RankingCard.tsx
```

## Database Schema

```sql
-- Tabla para historial de búsquedas
CREATE TABLE public.user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_history_user_id ON public.user_search_history(user_id);
CREATE INDEX idx_search_history_created_at ON public.user_search_history(created_at DESC);

ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
ON public.user_search_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert search history"
ON public.user_search_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Función para rankings
CREATE OR REPLACE FUNCTION get_top_users_by_metric(
  metric TEXT,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  avatar_url TEXT,
  value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY 
      CASE metric
        WHEN 'total_minutes' THEN gs.total_minutes
        WHEN 'movies_watched' THEN gs.total_movies_watched
        WHEN 'games_played' THEN gs.total_games_played
        WHEN 'games_platinum' THEN gs.total_games_platinum
        ELSE gs.total_minutes
      END DESC
    )::BIGINT as rank,
    u.id as user_id,
    u.username,
    u.avatar_url,
    (CASE metric
      WHEN 'total_minutes' THEN gs.total_minutes
      WHEN 'movies_watched' THEN gs.total_movies_watched
      WHEN 'games_played' THEN gs.total_games_played
      WHEN 'games_platinum' THEN gs.total_games_platinum
      ELSE gs.total_minutes
    END)::NUMERIC as value
  FROM public.users u
  JOIN public.user_global_stats gs ON u.id = gs.user_id
  WHERE u.is_public = true
  ORDER BY rank
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/discover/page.tsx` | New | Página unificada search+explore |
| `src/app/rankings/page.tsx` | New | Página de rankings |
| `src/app/api/search/route.ts` | New | API de búsqueda |
| `src/app/api/discover/route.ts` | New | API de tendencias |
| `src/app/api/search-history/route.ts` | New | API historial |
| `src/app/api/rankings/route.ts` | New | API rankings |
| `src/components/discover/` | New | Componentes discover |
| `src/components/rankings/` | New | Componentes rankings |
| `src/components/layout/Navbar.tsx` | Modified | Añadir Discover + Rankings |
| `supabase/migrations/028_search_discover.sql` | New | Historial + función rankings |
| `src/modules/shared/domain/` | Modified | Tipos de búsqueda |

## Success Criteria

- [ ] Página `/discover` funciona tanto para search como para discover
- [ ] Tipo selector filtra correctamente entre movies/tv/games/users
- [ ] Filtros avanzados se muestran según tipo seleccionado
- [ ] Resultados se cargan con debounce 300ms
- [ ] Historial de búsquedas se guarda y muestra
- [ ] `/rankings` muestra top 10 usuarios por cada métrica
- [ ] UI responsive (mobile/tablet/desktop)
- [ ] Build pasa sin errores
- [ ] Dark theme consistente con el resto de la app