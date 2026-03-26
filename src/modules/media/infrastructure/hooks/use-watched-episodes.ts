/**
 * useWatchedEpisodes - React Query hook for watching episode state
 * 
 * Provides cached episode data with automatic background refetching.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWatchedEpisodes } from "@/modules/media/infrastructure/queries/episode-queries";
import type { WatchedEpisodesResponse, WatchedEpisode } from "@/modules/media/domain/episode.types";

/**
 * Query key factory for episode-related queries
 */
export const episodeKeys = {
  /** Base key for all episode queries */
  all: ["episodes"] as const,
  
  /** Key for watched episodes of a specific TV show */
  watched: (tmdbId: number) => ["episodes", "watched", tmdbId] as const,
  
  /** Key for a specific episode's detail */
  detail: (tmdbId: number, season: number, episode: number) =>
    ["episodes", "detail", tmdbId, season, episode] as const,
};

/**
 * Hook to fetch and cache watched episodes for a TV show
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @returns Query result with watched episodes data
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useWatchedEpisodes(12345);
 * 
 * const isEpisodeWatched = (season: number, episode: number) => {
 *   return data?.watchedEpisodes.some(
 *     e => e.seasonNumber === season && e.episodeNumber === episode
 *   );
 * };
 * ```
 */
export function useWatchedEpisodes(tmdbId: number | null) {
  return useQuery({
    // Only run query if we have a valid tmdbId
    queryKey: episodeKeys.watched(tmdbId ?? 0),
    queryFn: () => fetchWatchedEpisodes(tmdbId!),
    enabled: tmdbId !== null,
    
    // Cache configuration - NO persistent cache for watched episodes
    // Always fetch fresh data when component mounts
    staleTime: 0,                 // Always stale
    gcTime: 5 * 60 * 1000,       // 5 minutes garbage collection
    
    // Always refetch on mount to get fresh data
    refetchOnMount: true,
    
    retry: 1,
    
    // Don't refetch on window focus (we invalidate manually)
    refetchOnWindowFocus: false,
    
    // Don't refetch when reconnecting (we handle this manually)
    refetchOnReconnect: false,
  });
}

export function useWatchedEpisodeSet(tmdbId: number | null) {
  const { data, ...rest } = useWatchedEpisodes(tmdbId);
  
  const watchedSet = React.useMemo(() => {
    if (!data?.watchedEpisodes) {
      return new Set<string>();
    }
    
    const set = new Set<string>();
    for (const episode of data.watchedEpisodes) {
      const key = `tv_${episode.tmdbId}_s${episode.seasonNumber}_e${episode.episodeNumber}`;
      set.add(key);
    }
    return set;
  }, [data?.watchedEpisodes]);
  
  return { data: watchedSet, ...rest };
}

/**
 * Hook to check if a specific episode is watched
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @param season - Season number
 * @param episode - Episode number
 * @returns Boolean indicating if episode is watched
 */
export function useIsEpisodeWatched(
  tmdbId: number | null,
  season: number,
  episode: number
) {
  const { data: watchedSet } = useWatchedEpisodeSet(tmdbId);
  
  const key = tmdbId !== null ? `tv_${tmdbId}_s${season}_e${episode}` : null;
  
  return {
    isWatched: key ? watchedSet.has(key) : false,
    watchedSet,
  };
}

/**
 * Hook to get count of watched episodes
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @returns Object with watchedCount and total count
 */
export function useWatchedEpisodeCount(
  tmdbId: number | null,
  totalEpisodes: number
) {
  const { data: watchedSet, ...rest } = useWatchedEpisodeSet(tmdbId);
  
  return {
    watchedCount: watchedSet.size,
    totalEpisodes,
    isComplete: watchedSet.size >= totalEpisodes && totalEpisodes > 0,
    ...rest,
  };
}

/**
 * Helper to manually update the watched episodes cache
 * Useful for optimistic updates
 */
export function useUpdateWatchedEpisodesCache() {
  const queryClient = useQueryClient();
  
  return (
    tmdbId: number,
    updater: (
      previous: WatchedEpisodesResponse | undefined
    ) => WatchedEpisodesResponse | undefined
  ) => {
    queryClient.setQueryData<WatchedEpisodesResponse>(
      episodeKeys.watched(tmdbId),
      updater
    );
  };
}

import React from "react";


