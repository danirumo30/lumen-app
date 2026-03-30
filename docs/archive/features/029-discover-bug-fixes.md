# 029: Discover Bug Fixes & UX Improvements

## Overview
Corrección de bugs críticos en la página `/discover` que impedían la carga de juegos y filtrado,加上 mejoras de UX y consistencia con el home.

## Problem Statement
- **Juegos no cargan:** Error de sintaxis en query de IGDB (falta `;` después de `where`)
- **Filtros TV/movies inconsistentes:** GenreMaps diferentes entre filtros y search API
- **Descripciones en inglés:** No se traducen según idioma del navegador
- **UI móvil rota:** Inputs de tiempo de juego mal diseñados para pantallas pequeñas
- **Contenido inconsistente:** Pestaña "todos" usaba endpoint diferente a pestañas individuales

## Solution Architecture

### 1. IGDB Query Fix
**Archivo:** `src/app/api/discover/route.ts:367`
```typescript
// ANTES (incorrecto):
queryBody += " where " + conditions.join(" & ");
queryBody += " sort " + sortValue + " desc";

// DESPUÉS (correcto):
queryBody += " where " + conditions.join(" & ") + ";";
queryBody += " sort " + sortValue + " desc;";
```

### 2. Genre Synchronization
**Archivos:** `src/app/api/search/route.ts:210-227`
- Sincronizado genreMap de TV con `discover/route.ts`
- Agregados géneros faltantes en movies: "Bélica", "Crimen", "Familia", "Fantasía", etc.
- IDs de terror unificados (9648 = Mystery que incluye horror)

### 3. Auto Translation
**Archivo:** `src/app/api/games/[id]/route.ts`
```typescript
// Detectar idioma del navegador
const acceptLanguage = request.headers.get('accept-language') || 'en';
const browserLang = acceptLanguage.split(',')[0].split('-')[0];

// Traducir si no es inglés
if (shouldTranslate) {
  summary = await translateText(summary!, targetLang);
}
```
- **Idiomas:** Español, francés, alemán, italiano, portugués (default: español)
- **Caching:** Incluye idioma en clave de cache

### 4. Mobile UI Redesign
**Archivo:** `src/components/games/GameInfo.tsx:651-698`
- Layout responsivo: columna en móvil, fila en desktop
- Labels claros para "Horas" y "Minutos"
- Botón "Guardar" ancho completo en móvil

### 5. Endpoint Consistency
**Archivo:** `src/components/discover/DiscoverGrid.tsx`
```typescript
if (type === "all" && !query) {
  // Fetch from individual discover endpoints
  const [moviesRes, tvRes, gamesRes, usersRes] = await Promise.all([
    fetch(`/api/discover?type=movie&${filtersParams}`),
    fetch(`/api/discover?type=tv&${filtersParams}`),
    fetch(`/api/discover?type=game&${filtersParams}`),
    fetch(`/api/search?type=user`),
  ]);
}
```
- "Todos" ahora usa mismos endpoints que pestañas individuales
- Límite de 10 items por tipo en "todos"

### 6. Trending by Default
**Archivo:** `src/app/api/discover/route.ts`
- Sin filtros: usa `/trending/movie/week` y `/trending/tv/week` (igual que home)
- Con filtros: usa `/discover/movie` y `/discover/tv` (normal)
- Juegos: muestra últimos año con rating, sorted by `first_release_date desc`

## Technical Decisions

### Caching Strategy
- **Traducciones:** Cache por idioma (`game_${igdbId}_${targetLang}`)
- **Trending:** Cache 1 hora (`Cache-Control: public, s-maxage=3600`)
- **IGDB:** Cache 15 minutos con TTL

### Error Handling
- **Translation:** Fallback a texto original si falla
- **IGDB:** Log detallado de errores con query fallida
- **TMDB:** Fail silently en providers, mostrar contenido sin logos

## Testing Approach
- **Manual:** Verificar cada pestaña de discover
- **Idioma:** Cambiar idioma navegador y verificar traducción
- **Mobile:** Verificar UI en emulador móvil
- **Filtros:** Probar cada filtro (género, plataforma, año, rating, sort)

## Migration Notes
- No requiere migración de base de datos
- Compatible con implementación anterior
- Cache debe invalidarse manualmente si hay issues