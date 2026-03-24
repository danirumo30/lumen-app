# Informe de Bugs - Lumen App (Página /discover)

## Estado Actual
- **Rama**: `feat/search-navigation-and-ranking`
- **Cambios sin commitear**: `src/app/api/discover/route.ts` (diff para sorting de juegos)
- **Último commit**: `df6b17a` - fix(discover): update TV genre names

---

## BUGS ENCONTRADOS (8 total)

### 1. **CRÍTICO: Sorting para juegos está roto**
**Archivo**: `src/app/api/discover/route.ts:355`

**Problema**: El diff sin commitear rompe el sorting por popularidad. Cuando el usuario selecciona "Popularidad" o "Relevancia", los juegos se ordenan por fecha de lanzamiento en vez de popularidad.

**Código problemático**:
```typescript
const sortValue = filters?.sortBy === "rating" ? "rating" : (filters?.sortBy === "year" ? "first_release_date" : "first_release_date");
```

**Consecuencia**: Los usuarios no pueden ver los juegos más populares primero.

---

### 2. **Nombres de géneros TV no coinciden**
**Archivos**: 
- `src/components/discover/DiscoverFilters.tsx:23`
- `src/app/api/search/route.ts:195`

**Problema**: 
- Filtros usan: "Sci-Fi & Fantasía", "Misterio & Terror"
- Search API espera: "Ciencia Ficción", "Terror"

**Consecuencia**: Los filtros de género para TV no funcionan cuando se busca.

---

### 3. **IDs de género terror diferentes**
**Archivos**:
- `src/app/api/discover/route.ts:218` → ID 9648 (Mystery)
- `src/app/api/search/route.ts:195` → ID 10770 (Thriller)

**Consecuencia**: Resultados diferentes para terror entre APIs.

---

### 4. **Mapeo incompleto de géneros en search API**
**Archivo**: `src/app/api/search/route.ts:194-197`

**Problema**: Faltan géneros: Kids, News, Reality, Soap, Talk, War & Politics, Western, Crime, Family

---

### 5. **Logging insuficiente en errores IGDB**
**Archivo**: `src/app/api/discover/route.ts:373`

**Problema**: No se loguea la query que falló, dificultando debugging.

---

### 6. **País hardcodeado a "ES"**
**Archivos**: `route.ts:53,180` y `search/route.ts:63,166`

**Problema**: Proveedores de streaming siempre para España.

---

### 7. **Promise.allSettled sin logging de errores**
**Archivo**: `src/app/api/discover/route.ts:429-433`

**Problema**: Errores silenciosos si una API falla.

---

### 8. **Mapeo simplificado de plataformas**
**Archivo**: `src/app/api/discover/route.ts:316-324`

**Problema**: Solo un ID por plataforma, no cubre todas las variantes (ej: PS4, PS5).

---

## FIXES PENDIENTES DE COMMITS

### Listo para commitear:
- ✅ Altura de dropdown limitada (commit 502713e)
- ✅ Nombres de géneros TV traducidos (commit df6b17a)

### Necesita trabajo:
1. **Sincronizar géneros TV** entre filtros y search API
2. **Arreglar sorting** para juegos
3. **Agregar géneros faltantes** en search API
4. **Unificar IDs** de género terror
5. **Mejorar logging** de errores IGDB

---

## FIXES SUGERIDOS (Prioridad Alta)

### 1. Arreglar sorting para juegos
```typescript
// En src/app/api/discover/route.ts línea 355
const sortValue = filters?.sortBy === "rating" ? "rating" : 
                  filters?.sortBy === "year" ? "first_release_date" : 
                  "rating"; // Fallback a rating en vez de popularity
```

### 2. Sincronizar géneros TV
Copiar los nombres exactos de `DiscoverFilters.tsx` a `search/route.ts`

### 3. Unificar IDs de terror
Usar el mismo ID (9648 o 10770) en ambas APIs

---

## CONCLUSIÓN

Tu "compa el otro modelo de IA" se quedó sin tokens porque estaba lidiando con este quilombo de inconsistencias. El bug crítico de sorting rompe la funcionalidad core para juegos. 

Los commits muestran progreso pero falta sincronización entre archivos. Recomiendo:
1. Commitear el diff actual (pero arreglar el bug primero)
2. Sincronizar nombres de géneros
3. Agregar tests para evitar regressions

**Tiempo estimado de fix**: 30 minutos para los bugs críticos.
