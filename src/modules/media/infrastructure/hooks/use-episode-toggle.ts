/**
 * useEpisodeToggle - React Query mutation hook for single episode toggle
 * 
 * Implements optimistic updates with automatic rollback on error.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleEpisode } from "@/modules/media/infrastructure/queries/episode-queries";
import { episodeKeys } from "./use-watched-episodes";
import { profileKeys } from "@/lib/query-client";
import { supabase } from "@/lib/supabase";
import type {
  WatchedEpisode,
  WatchedEpisodesResponse,
  getEpisodeMediaId,
} from "@/modules/media/domain/episode.types";

/**
 * Variables for the episode toggle mutation
 */
export interface ToggleEpisodeVariables {
  /** Season number */
  season: number;
  /** Episode number */
  episode: number;
  /** Whether to mark as watched (true) or unwatched (false) */
  watched: boolean;
  /** Episode runtime in minutes (for stats calculation) */
  runtime?: number;
}

/**
 * Hook for toggling a single episode's watched status
 * 
 * Features:
 * - Optimistic update (instant UI feedback)
 * - Automatic rollback on error
 * - Profile stats invalidation on success
 * - Works with the watched episodes query cache
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @returns Mutation object with mutate() function and states
 * 
 * @example
 * ```tsx
 * const toggleMutation = useEpisodeToggle(12345);
 * 
 * // Mark episode as watched
 * toggleMutation.mutate({
 *   season: 1,
 *   episode: 5,
 *   watched: true,
 *   runtime: 45,
 * });
 * 
 * // Check mutation state
 * if (toggleMutation.isPending) {
 *   return <Spinner />;
 * }
 * ```
 */
export function useEpisodeToggle(tmdbId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: ToggleEpisodeVariables) => {
      if (tmdbId === null) {
        throw new Error("tmdbId is required");
      }

      return toggleEpisode(
        tmdbId,
        variables.season,
        variables.episode,
        variables.watched,
        variables.runtime
      );
    },

    onMutate: async (variables) => {
      if (tmdbId === null) return;

      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });

      // Snapshot the previous value for rollback
      const previousData = queryClient.getQueryData<WatchedEpisodesResponse>(
        episodeKeys.watched(tmdbId)
      );

      // Calculate the episode media_id
      const episodeKey = `tv_${tmdbId}_s${variables.season}_e${variables.episode}`;

      // Optimistically update the cache
      queryClient.setQueryData<WatchedEpisodesResponse>(
        episodeKeys.watched(tmdbId),
        (old) => {
          if (!old) {
            return {
              watchedEpisodes: variables.watched
                ? [{ tmdbId, seasonNumber: variables.season, episodeNumber: variables.episode }]
                : [],
            };
          }

          const watchedSet = new Set<string>();
          for (const ep of old.watchedEpisodes) {
            watchedSet.add(`tv_${ep.tmdbId}_s${ep.seasonNumber}_e${ep.episodeNumber}`);
          }

          if (variables.watched) {
            watchedSet.add(episodeKey);
          } else {
            watchedSet.delete(episodeKey);
          }

          const watchedEpisodes: WatchedEpisode[] = [];
          for (const key of watchedSet) {
            const match = key.match(/tv_(\d+)_s(\d+)_e(\d+)/);
            if (match) {
              watchedEpisodes.push({
                tmdbId: parseInt(match[1], 10),
                seasonNumber: parseInt(match[2], 10),
                episodeNumber: parseInt(match[3], 10),
              });
            }
          }

          return { watchedEpisodes };
        }
      );

      return { previousData };
    },

    onError: (error, variables, context) => {
      if (tmdbId === null) return;

      console.error("[useEpisodeToggle] Error:", error);

      // Rollback to the snapshot on error
      if (context?.previousData) {
        queryClient.setQueryData<WatchedEpisodesResponse>(
          episodeKeys.watched(tmdbId),
          context.previousData
        );
      }
    },

    onSettled: (data, error, variables) => {
      if (tmdbId === null) return;

      // Always refetch after mutation settles to ensure consistency
      queryClient.invalidateQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });

      // Also invalidate TV status (series watched status)
      queryClient.invalidateQueries({
        queryKey: ["tv-status"],
      });

      // Also invalidate profile stats since episode counts affect stats
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });

      // Dispatch custom event for non-React Query listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(error ? 'episode-sync-error' : 'episode-sync-success', {
          detail: { tmdbId, success: !error },
        }));
      }
    },
  });
}

/**
 * Hook for optimistic episode toggle with queue support
 * 
 * Use this when you want the queue to batch multiple rapid toggles
 * but still want optimistic updates for the first toggle.
 * 
 * Note: The queue handles the actual persistence, this just updates UI.
 */
export function useOptimisticEpisodeToggle(tmdbId: number | null) {
  const queryClient = useQueryClient();

  return {
    /**
     * Optimistically toggle an episode immediately
     * The actual persistence will be handled by the episode update queue
     */
    optimisticToggle: (variables: ToggleEpisodeVariables) => {
      if (tmdbId === null) return;

      queryClient.cancelQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });

      const previousData = queryClient.getQueryData<WatchedEpisodesResponse>(
        episodeKeys.watched(tmdbId)
      );

      const episodeKey = `tv_${tmdbId}_s${variables.season}_e${variables.episode}`;

      queryClient.setQueryData<WatchedEpisodesResponse>(
        episodeKeys.watched(tmdbId),
        (old) => {
          if (!old) {
            return {
              watchedEpisodes: variables.watched
                ? [{ tmdbId, seasonNumber: variables.season, episodeNumber: variables.episode }]
                : [],
            };
          }

          const watchedSet = new Set<string>();
          for (const ep of old.watchedEpisodes) {
            watchedSet.add(`tv_${ep.tmdbId}_s${ep.seasonNumber}_e${ep.episodeNumber}`);
          }

          if (variables.watched) {
            watchedSet.add(episodeKey);
          } else {
            watchedSet.delete(episodeKey);
          }

          const watchedEpisodes: WatchedEpisode[] = [];
          for (const key of watchedSet) {
            const match = key.match(/tv_(\d+)_s(\d+)_e(\d+)/);
            if (match) {
              watchedEpisodes.push({
                tmdbId: parseInt(match[1], 10),
                seasonNumber: parseInt(match[2], 10),
                episodeNumber: parseInt(match[3], 10),
              });
            }
          }

          return { watchedEpisodes };
        }
      );

      return { previousData };
    },

    /**
     * Rollback the optimistic update
     */
    rollback: (snapshot: { previousData?: WatchedEpisodesResponse }) => {
      if (tmdbId === null || !snapshot.previousData) return;

      queryClient.setQueryData<WatchedEpisodesResponse>(
        episodeKeys.watched(tmdbId),
        snapshot.previousData
      );
    },
  };
}

/**
 * Hook to invalidate episode-related queries
 * Useful for triggering refreshes from outside components
 */
export function useInvalidateEpisodeQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateWatchedEpisodes: (tmdbId: number) => {
      queryClient.invalidateQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });
    },

    invalidateAllEpisodes: () => {
      queryClient.invalidateQueries({
        queryKey: episodeKeys.all,
      });
    },

    invalidateProfileStats: () => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },

    invalidateAll: (tmdbId: number) => {
      queryClient.invalidateQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },
  };
}

