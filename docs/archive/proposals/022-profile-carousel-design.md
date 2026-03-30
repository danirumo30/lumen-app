# 022 - Profile Carousel Design

## Intent
Reformatear la página de perfil para usar carruseles horizontales (tipo TVTime) en lugar de grids y tabs.

## Scope
- ProfileStats: Cambiar de grid 4 columnas a carrusel horizontal
- MediaTabs: Eliminar tabs y mostrar 3 carruseles (series, películas, juegos)
- Reemplazar emojis por iconos SVG profesionales

## Approach
1. Crear componente Carrusel reutilizable
2. ProfileStats → carrusel de 4 cards horizontales con scroll
3. MediaTabs → 3 carruseles visibles (no tabs) con watched/favorites como toggle
4. Reemplazar emojis 📺 🎬 🎮 con iconos SVG

## Affected Areas
- `src/components/profile/ProfileStats.tsx`
- `src/components/profile/MediaTabs.tsx`
- `src/components/profile/MediaGrid.tsx`

## Success Criteria
- [ ] Stats en carrusel horizontal
- [ ] 3 carruseles para media (series, películas, juegos)
- [ ] Iconos SVG en lugar de emojis
- [ ] Diseño similar a TVTime
