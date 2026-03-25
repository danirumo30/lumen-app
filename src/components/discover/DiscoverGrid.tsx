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
    setResults([]);
    setIsLoading(true);
  }, [query, type, filters]);

  // Load more handler
  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  // Helper: apply only accessType filter (providerIds is handled by backend)
  const applyStreamingFilters = useCallback((items: SearchResult[]) => {
    if (type !== "movie" && type !== "tv") return items;
    const { accessType } = filters;
    return items.filter(item => {
      if (accessType && !item.providers?.some((p: any) => p.type === accessType)) {
        return false;
      }
      return true;
    });
  }, [type, filters]);

  // Fetch results
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        params.set("type", type);
        params.set("page", String(page));

        if (query && query.trim().length >= 2) {
          params.set("q", query);
        }

        // Add filters if any
        const filterParams: Record<string, string | number[]> = {};
        if (filters.genre) filterParams.genre = filters.genre;
        if (filters.yearFrom) filterParams.yearFrom = String(filters.yearFrom);
        if (filters.yearTo) filterParams.yearTo = String(filters.yearTo);
        if (filters.minRating) filterParams.minRating = String(filters.minRating);
        if (filters.platform) filterParams.platform = filters.platform;
        if (filters.providerIds && filters.providerIds.length > 0) {
          filterParams.providerIds = filters.providerIds;
        }
        if (filters.accessType) filterParams.accessType = filters.accessType;
        if (filters.sortBy) {
          filterParams.sortBy = filters.sortBy;
          if (filters.sortDirection) filterParams.sortDirection = filters.sortDirection;
        }

        const hasFilters = Object.keys(filterParams).length > 0;
        if (hasFilters) {
          params.set("filters", JSON.stringify(filterParams));
        }

        // Log reducido solo para debug
        // console.log(`[DiscoverGrid] Fetching page ${page} with params:`, params.toString());

        const response = await fetch(`/api/discover?${params.toString()}`);
         
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(`Discover error: ${response.status}`);
        }

        const data = await response.json();
        console.log(`[DiscoverGrid] Page ${page} returned:`, {
          movies: data.movies?.length || 0,
          tv: data.tv?.length || 0,
          games: data.games?.length || 0,
          users: data.users?.length || 0,
        });

        // Combine results based on type
        let newResults: SearchResult[] = [];
        if (type === "all") {
          // When showing "All", limit to 10 per type and include users
          newResults = [
            ...(data.movies?.slice(0, 10) || []),
            ...(data.tv?.slice(0, 10) || []),
            ...(data.games?.slice(0, 10) || []),
            ...(data.users?.slice(0, 10) || []),
          ];
        } else if (type === "movie") {
          newResults = data.movies || [];
        } else if (type === "tv") {
          newResults = data.tv || [];
        } else if (type === "game") {
          newResults = data.games || [];
        }
        // Note: type "user" is not a selectable tab, only appears in "all"

        // Apply streaming filters (provider/accessType)
        const filteredResults = applyStreamingFilters(newResults);
        console.log(`[DiscoverGrid] After streaming filters: ${filteredResults.length} items`);

        if (page === 1) {
          setResults(filteredResults);
        } else {
          setResults(prev => [...prev, ...filteredResults]);
        }

        // If we got less than 20 items, likely no more pages
        setHasMore(filteredResults.length >= 20);

        setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("[DiscoverGrid] Error:", err);
          setError(err instanceof Error ? err.message : "Error cargando resultados");
          setIsLoading(false);
        }
      }
    }, 300);

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
              providers={result.providers as any}
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
