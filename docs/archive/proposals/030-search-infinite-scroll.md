# 030 - Search Infinite Scroll

## Intent
Implementar scroll infinito en la página `/search` para cargar más resultados de TMDB/IGDB conforme el usuario hace scroll, sin necesidad de botones de paginación. Los nuevos resultados deben aparecer instantáneamente en el mismo punto del scroll (no debe mover la posición del usuario).

## Scope

### Backend
- Modificar `/api/search/route.ts` para devolver `hasMore` (boolean) en la respuesta para movies, TV y games
- El parámetro `page` ya existe y funciona

### Frontend  
- Modificar `/search/page.tsx`:
  - Agregar estado: `page`, `hasMore`, `isLoadingMore`
  - Implementar `IntersectionObserver` con un "sentinel" (div invisible al final de la lista)
  - Cuando el sentinel sea visible y `hasMore === true`, hacer fetch de la siguiente página
  - **Append** los nuevos resultados a los existentes (no replace)
  - Mostrar spinner de carga cuando `isLoadingMore === true`
  - No mover el scroll del usuario al cargar más resultados

## Approach

### Backend
1. Las funciones `searchMovies`, `searchTv`, `searchGames` ya soportan `page`
2. Agregar lógica para obtener `total_pages` de TMDB (viene en la respuesta de la API)
3. Devolver en el JSON: `{ movies, tv, games, users, hasMore: { movies: boolean, tv: boolean, games: boolean } }`

### Frontend
1. **Estado inicial:**
   ```typescript
   const [results, setResults] = useState<SearchResult[]>([]);
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState({ movies: true, tv: true, games: true });
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   ```

2. **IntersectionObserver:**
   - Crear un `useRef` para el sentinel (último elemento de la lista o un div vacío al final)
   - Cuando sea visible y `!isLoadingMore` y `hasMore[activeTab]`, incrementar página y hacer fetch

3. **Fetch con append:**
   ```typescript
   const loadMore = async () => {
     setIsLoadingMore(true);
     const nextPage = page + 1;
     const response = await fetch(`/api/search?q=${query}&type=${typeParam}&page=${nextPage}`);
     const data = await response.json();
     
     // Append nuevos resultados
     setResults(prev => [...prev, ...newResults]);
     setPage(nextPage);
     setHasMore({ ...data.hasMore });
     setIsLoadingMore(false);
   };
   ```

4. **Sentinel:**
   ```tsx
   <div ref={sentinelRef} className="h-4" />
   {isLoadingMore && <LoadingSpinner />}
   ```

## Affected Areas

| File | Change |
|------|--------|
| `src/app/api/search/route.ts` | Agregar `hasMore` al response |
| `src/app/search/page.tsx` | Infinite scroll con IntersectionObserver |

## Risks

- **Performance:** TMDB tiene rate limits (40 req/segundo). El infinite scroll hace muchas requests. Mitigation: Usar `page` param que ya existe.
- **Scroll position reset:** React puede resetear el scroll al hacer setState. Mitigation: Append-only, no replace.
- **Race conditions:** Si el usuario hace scroll rápido, múltiples requests pueden ejecutarse. Mitigation: `isLoadingMore` flag como mutex.

## Success Criteria

- [ ] Al hacer scroll hasta el final, se cargan automáticamente más resultados
- [ ] Los nuevos resultados aparecen sin mover la posición del scroll
- [ ] Cuando TMDB/IGDB no tiene más páginas, no se intent cargar más (hasMore = false)
- [ ] El spinner de carga aparece al final mientras carga más resultados
- [ ] Al cambiar de tab (movies/TV/games/users), el estado de pagination se resetea

## Technical Notes

- TMDB devuelve `total_pages` en la respuesta. Usar eso para calcular `hasMore = page < total_pages`
- IGDB no tiene `total_pages`, pero devuelve menos de 20 resultados cuando llega al final. Usar `results.length < 20` como proxy de "no hay más"
- El sentinel debe estar dentro del contenedor con scroll, no en la página entera
