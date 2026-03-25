"use client";

import { useEffect, useState, useCallback } from "react";
import { DiscoverCard } from "./DiscoverCard";
import { DiscoverSkeleton } from "./DiscoverSkeleton";
import { MediaType } from "./DiscoverTypeChips";
import { DiscoverFilters } from "./DiscoverFilters";

interface SearchResult {
  id: string;
  type: "movie" | "tv" | "game" | "user";
  title: string;
  posterUrl?: string | null;
  voteAverage?: number | null;
  releaseDate?: string;
  overview?: string;
  genres?: string[];
  platforms?: string[];
  username?: string;
  avatarUrl?: string | null;
  providers?: any[]; // WatchProvider[] from shared
  platformLogos?: any[];
}

interface DiscoverGridProps {
  query: string;
  type: MediaType;
  filters: DiscoverFilters;
}

export function DiscoverGrid({ query, type, filters }: DiscoverGridProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Reset page when query, type, or filters change
  useEffect(() => {
    setPage(1);
    setHasMore(false);
    setIsLoading(true);
  }, [query, type, filters]);

  // Load more handler
  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  // Helper: apply provider/accessType filters to a result array
  const applyStreamingFilters = useCallback((items: SearchResult[]) => {
    if (type !== "movie" && type !== "tv") return items;
    const { providerIds, accessType } = filters;
    return items.filter(item => {
      // Si hay providerIds seleccionados, el item debe coincidir con al menos uno
      if (providerIds && providerIds.length > 0) {
        if (!item.providers?.some((p: any) => providerIds.includes(p.id))) {
          return false;
        }
      }
      if (accessType && !item.providers?.some((p: any) => p.type === accessType)) {
        return false;
      }
      return true;
    });
  }, [type, filters]);

  // Debounced fetch
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("type", type);

        if (query && query.trim().length >= 2) {
          params.set("q", query);
        }

        if (filters) {
          params.set("filters", JSON.stringify(filters));
        }

        if (type === "all") {
          const hasQuery = query && query.trim().length >= 2;
          const searchParams = new URLSearchParams();
          if (hasQuery) searchParams.set("q", query);
          const filtersParams = new URLSearchParams();
          if (filters) filtersParams.set("filters", JSON.stringify(filters));

          const useDiscover = !hasQuery && filters;
          const endpointPrefix = useDiscover ? "/api/discover" : "/api/search";
          let moviesUrl = `${endpointPrefix}?type=movie`;
          let tvUrl = `${endpointPrefix}?type=tv`;
          let gamesUrl = `${endpointPrefix}?type=game`;
          if (hasQuery) {
            moviesUrl += `&${searchParams.toString()}`;
            tvUrl += `&${searchParams.toString()}`;
            gamesUrl += `&${searchParams.toString()}`;
          }
          const filtersString = filtersParams.toString();
          if (filtersString) {
            moviesUrl += `&${filtersString}`;
            tvUrl += `&${filtersString}`;
            gamesUrl += `&${filtersString}`;
          }

          const [moviesRes, tvRes, gamesRes, usersRes] = await Promise.all([
            fetch(moviesUrl),
            fetch(tvUrl),
            fetch(gamesUrl),
            fetch(`/api/search?type=user&${searchParams.toString()}`)
          ]);

          if (cancelled) return;

          const [moviesData, tvData, gamesData, usersData] = await Promise.all([
            moviesRes.json(),
            tvRes.json(),
            gamesRes.json(),
            usersRes.json(),
          ]);

          const combined = [
            ...applyStreamingFilters(moviesData.movies || []).slice(0, 10),
            ...applyStreamingFilters(tvData.tv || []).slice(0, 10),
            ...(gamesData.games || []).slice(0, 10),
            ...(usersData.users || []).slice(0, 10),
          ];

          setResults(combined);
          setHasMore(false);
          return;
        }

        const hasQuery = query && query.trim().length >= 2;
        const isUserOnly = type === "user";
        params.set("page", page.toString());
        const useSearch = hasQuery || isUserOnly;
        const endpoint = useSearch ? "/api/search" : "/api/discover";
        const url = `${endpoint}?${params.toString()}`;

        const response = await fetch(url);
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch");
        }

        let newResults: SearchResult[] = [];
        if (type === "movie") {
          newResults = applyStreamingFilters(data.movies || []);
        } else if (type === "tv") {
          newResults = applyStreamingFilters(data.tv || []);
        } else if (type === "game") {
          newResults = data.games || [];
        } else if (type === "user") {
          newResults = data.users || [];
        }

        // Client-side fallback sorting for movie/tv when TMDB may not honor sort_by during search
        if (hasQuery && filters.sortBy && (type === "movie" || type === "tv")) {
          const direction = filters.sortDirection === "asc" ? 1 : -1;
          newResults.sort((a, b) => {
            switch (filters.sortBy) {
              case "popularity":
              case "rating":
                return ((a.voteAverage || 0) - (b.voteAverage || 0)) * direction;
              case "year":
                const aYear = a.releaseDate ? new Date(a.releaseDate).getFullYear() : 0;
                const bYear = b.releaseDate ? new Date(b.releaseDate).getFullYear() : 0;
                return (aYear - bYear) * direction;
              default:
                return 0;
            }
          });
        }

        if (page === 1) {
          setResults(newResults);
        } else {
          setResults(prev => [...prev, ...newResults]);
        }

        setHasMore(newResults.length > 0);
      } catch (err) {
        if (!cancelled) {
          console.error("Fetch error:", err);
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      cancelled = true;
    };
  }, [query, type, filters, page, applyStreamingFilters]);

  if (isLoading && results.length === 0) {
    return <DiscoverSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Algo salió mal</h3>
        <p className="text-zinc-500">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800/50 mb-6">
          <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No se encontraron resultados</h3>
        <p className="text-zinc-500">Prueba con otros términos de búsqueda</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((result, index) => (
          <div
            key={`${result.id}-${index}`}
            className="animate-in fade-in slide-in-from-bottom-2"
            style={{ animationDelay: `${(index % 20) * 30}ms` }}
          >
            <DiscoverCard
              id={result.id}
              type={result.type}
              title={result.title}
              posterUrl={result.posterUrl}
              voteAverage={result.voteAverage}
              releaseDate={result.releaseDate}
              genres={result.genres}
              platforms={result.platforms}
              username={result.username}
              avatarUrl={result.avatarUrl}
              providers={result.providers as any} // cast para evitar conflicto de tipos
              platformLogos={result.platformLogos}
            />
          </div>
        ))}
      </div>

      {hasMore && type !== "all" && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-8 py-3 rounded-xl bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 hover:bg-zinc-700/80 hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      )}
    </div>
  );
}
