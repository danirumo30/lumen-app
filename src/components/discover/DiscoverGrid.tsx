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
}

interface DiscoverGridProps {
  query: string;
  type: MediaType;
  filters: DiscoverFilters;
}

export function DiscoverGrid({ query, type, filters }: DiscoverGridProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build URL with params
      const params = new URLSearchParams();
      if (query) {
        params.set("q", query);
      }
      params.set("type", type);
      
      // Add filters as JSON
      if (Object.keys(filters).length > 0) {
        params.set("filters", JSON.stringify(filters));
      }

      const endpoint = query ? "/api/search" : "/api/discover";
      const url = `${endpoint}?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch");
      }

      // Combine results based on type
      let combined: SearchResult[] = [];

      if (type === "all") {
        // Mix results evenly or show all categories
        combined = [
          ...(data.movies || []),
          ...(data.tv || []),
          ...(data.games || []),
          ...(data.users || []),
        ];
      } else if (type === "movie") {
        combined = data.movies || [];
      } else if (type === "tv") {
        combined = data.tv || [];
      } else if (type === "game") {
        combined = data.games || [];
      } else if (type === "user") {
        combined = data.users || [];
      }

      setResults(combined);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [query, type, filters]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Empty state - no query
  if (!query && !isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800/50 mb-6">
          <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Descubre nuevo contenido
        </h3>
        <p className="text-zinc-500 max-w-md mx-auto">
          Busca películas, series, juegos o usuarios específicos, o explora las tendencias populares
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <DiscoverSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Algo salió mal
        </h3>
        <p className="text-zinc-500">{error}</p>
      </div>
    );
  }

  // No results
  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-zinc-800/50 mb-6">
          <svg className="w-10 h-10 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          No se encontraron resultados
        </h3>
        <p className="text-zinc-500">
          Prueba con otros términos de búsqueda
        </p>
      </div>
    );
  }

  // Results grid
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {results.map((result, index) => (
        <div
          key={result.id}
          className="animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: `${index * 30}ms` }}
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
          />
        </div>
      ))}
    </div>
  );
}
