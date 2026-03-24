"use client";

import { useEffect, useState } from "react";
import { DiscoverCard } from "./DiscoverCard";
import { DiscoverSkeleton } from "./DiscoverSkeleton";
import { MediaType } from "./DiscoverTypeChips";
import { DiscoverFilters } from "./DiscoverFilters";

interface StreamingProvider {
  id: number;
  name: string;
  logoUrl: string;
}

interface PlatformLogo {
  id: number;
  name: string;
  platformName?: string;
  logoUrl: string | null;
}

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
  providers?: StreamingProvider[];
  platformLogos?: PlatformLogo[];
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

  useEffect(() => {
    let cancelled = false;

    async function doFetch() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("type", type);

        // Only add query if it has at least 2 characters
        if (query && query.trim().length >= 2) {
          params.set("q", query);
        }

        // Add filters - ALWAYS add them
        console.log("Filters being sent:", filters);
        if (filters) {
          params.set("filters", JSON.stringify(filters));
        }

        // Use search API when:
        // - Has query (2+ chars) - search all types
        // - Type is "all" (to get users + trending content)
        // - Type is "user" (to get users)
        // Otherwise use discover API for trending content
        const hasQuery = query && query.trim().length >= 2;
        const isAll = type === "all";
        const isUserOnly = type === "user";
        
        // Use search API for: has query, all types, or user-only
        const useSearch = hasQuery || isAll || isUserOnly;
        const endpoint = useSearch ? "/api/search" : "/api/discover";
        const url = `${endpoint}?${params.toString()}`;
        
        console.log("Fetching:", url);

        const response = await fetch(url);
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch");
        }

        // Combine results based on type
        let combined: SearchResult[] = [];

        if (type === "all") {
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

        console.log("Search results:", { type, movies: data.movies?.length, tv: data.tv?.length, games: data.games?.length, users: data.users?.length, combined: combined.length });
        setResults(combined);
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
    }

    doFetch();

    return () => {
      cancelled = true;
    };
  }, [query, type, filters]);

  // Loading state - show on initial load
  if (isLoading && results.length === 0) {
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
            providers={result.providers}
            platformLogos={result.platformLogos}
          />
        </div>
      ))}
    </div>
  );
}
