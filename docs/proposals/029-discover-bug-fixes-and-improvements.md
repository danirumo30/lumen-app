# 029: Fixes Críticos y Mejoras en Discover

## Intent
Corregir bugs críticos en la página `/discover` que impedían la carga de juegos, filtros no funcionales, y falta de consistencia con el home. Mejorar UX en móvil y traducción automática de descripciones.

## Scope
- **Incluye:** Fixes de IGDB query syntax, sincronización de géneros TV/movies, traducción de descripciones, UI móvil, consistencia entre pestañas de discover
- **Excluye:** Cambios en lógica de autenticación, modificaciones de base de datos

## Approach
1. **Fix crítico IGDB:** Corregir sintaxis de query (falta de `;` después de `where`)
2. **Sincronización géneros:** Alinear genreMaps de TV y movies entre filtros y search API
3. **Traducción automática:** Implementar detección de idioma del navegador y traducción de descripciones
4. **UI móvil:** Rediseñar inputs de tiempo de juego para responsive
5. **Consistencia discover:** Asegurar que pestaña "todos" use mismos endpoints que pestañas individuales
6. **Tendencias por defecto:** Películas y series usan trending API (igual que home)

## Affected Areas
- `src/app/api/discover/route.ts` - Fixes IGDB + filtros + trending
- `src/app/api/search/route.ts` - Sincronización géneros
- `src/app/api/games/[id]/route.ts` - Traducción descripciones
- `src/components/games/GameInfo.tsx` - UI móvil
- `src/components/discover/DiscoverGrid.tsx` - Consistencia endpoints

## Risks
- **Performance:** Traducción de descripciones puede ser lenta (mitigado con caching)
- **Compatibilidad:** Cambios en sintaxis IGDB podrían afectar otras integraciones (verificado)
- **UX:** Limitar a 10 items en "todos" podría ocultar contenido (balanceado con "ver más")

## Success Criteria
- ✅ Juegos cargan correctamente en discover
- ✅ Filtros de género y plataforma funcionan para TV, movies y juegos
- ✅ Descripciones se traducen según idioma del navegador
- ✅ UI de tiempo de juego es responsive en móvil
- ✅ Contenido en "todos" es idéntico al de pestañas individuales
- ✅ Películas y series muestran tendencias por defecto (igual que home)