/**
 * useBatchEpisodeToggle - React Query mutation hook for batch episode operations
 * 
 * Handles marking/unmarking multiple episodes at once with optimistic updates.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleEpisodesBatch, updateSeriesWatchedStatus } from "@/modules/media/infrastructure/queries/episode-queries";
import { episodeKeys, useWatchedEpisodes } from "./use-watched-episodes";
import { profileKeys } from "@/lib/query-client";
import type { WatchedEpisode, WatchedEpisodesResponse } from "@/modules/media/domain/episode.types";

/**
 * Episode data for batch toggle
 */
export interface BatchEpisode {
  /** Season number */
  season: number;
  /** Episode number */
  episode: number;
  /** Whether to mark as watched (true) or unwatched (false) */
  watched: boolean;
  /** Episode runtime in minutes (optional, defaults to 0) */
  runtime?: number;
}

/**
 * Variables for batch episode toggle
 */
export interface BatchToggleVariables {
  /** Episodes to toggle */
  episodes: BatchEpisode[];
  /** Optional: TV series data to update series watched status */
  seriesData?: {
    title: string;
    originalTitle: string;
    releaseYear: number | null;
    firstAirDate: string;
    posterPath: string | null;
  };
}

/**
 * Hook for batch toggling multiple episodes
 * 
 * Features:
 * - Optimistic update for ALL episodes at once (instant UI)
 * - Chunked API calls (50 per batch) for large operations
 * - Automatic rollback on error
 * - Profile stats invalidation
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @returns Mutation object with mutate() function and states
 * 
 * @example
 * ```tsx
 * const batchMutation = useBatchEpisodeToggle(12345);
 * 
 * // Mark entire season as watched
 * batchMutation.mutate({
 *   episodes: [
 *     { season: 1, episode: 1, watched: true, runtime: 45 },
 *     { season: 1, episode: 2, watched: true, runtime: 42 },
 *     // ... all episodes
 *   ],
 * });
 * 
 * // Check if batch is pending
 * if (batchMutation.isPending) {
 *   return <LoadingIndicator />;
 * }
 * ```
 */
export function useBatchEpisodeToggle(tmdbId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: BatchToggleVariables) => {
      if (tmdbId === null) {
        throw new Error("tmdbId is required");
      }

      const episodes = variables.episodes.map((ep) => ({
        seasonNumber: ep.season,
        episodeNumber: ep.episode,
        watched: ep.watched,
        runtime: ep.runtime ?? 0,
      }));

      const result = await toggleEpisodesBatch(tmdbId, episodes);

      const hasWatchedEpisodes = variables.episodes.some((ep) => ep.watched);
      if (hasWatchedEpisodes && variables.seriesData) {
        await updateSeriesWatchedStatus(tmdbId, true, variables.seriesData);
      }

      return result;
    },

    onMutate: async (variables) => {
      if (tmdbId === null) return;

      await queryClient.cancelQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });

      const previousData = queryClient.getQueryData<WatchedEpisodesResponse>(
        episodeKeys.watched(tmdbId)
      );

      queryClient.setQueryData<WatchedEpisodesResponse>(
        episodeKeys.watched(tmdbId),
        (old) => {
          if (!old) {
            const watchedEpisodes: WatchedEpisode[] = variables.episodes
              .filter((ep) => ep.watched)
              .map((ep) => ({
                tmdbId,
                seasonNumber: ep.season,
                episodeNumber: ep.episode,
              }));

            return { watchedEpisodes };
          }

          const watchedSet = new Set<string>();
          for (const ep of old.watchedEpisodes) {
            watchedSet.add(`tv_${ep.tmdbId}_s${ep.seasonNumber}_e${ep.episodeNumber}`);
          }

          for (const ep of variables.episodes) {
            const key = `tv_${tmdbId}_s${ep.season}_e${ep.episode}`;
            if (ep.watched) {
              watchedSet.add(key);
            } else {
              watchedSet.delete(key);
            }
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

      console.error("[useBatchEpisodeToggle] Error:", error);

      if (context?.previousData) {
        queryClient.setQueryData<WatchedEpisodesResponse>(
          episodeKeys.watched(tmdbId),
          context.previousData
        );
      }
    },

    onSuccess: () => {
      if (tmdbId === null) return;

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });

      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },

    onSettled: () => {
      if (tmdbId === null) return;

      // Always refetch after mutation settles
      queryClient.invalidateQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });
    },
  });
}

/**
 * Hook specifically for marking all episodes of a season
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @param seasonNumber - The season number to toggle
 * @param episodes - Array of episodes in the season
 * @param isCurrentlyComplete - Whether all episodes are currently marked
 */
export function useSeasonToggle(
  tmdbId: number | null,
  seasonNumber: number,
  episodes: Array<{ episodeNumber: number; runtime?: number | null }>,
  isCurrentlyComplete: boolean
) {
  const batchMutation = useBatchEpisodeToggle(tmdbId);

  /**
   * Toggle all episodes in the season
   * If season is complete, unmark all. If incomplete, mark all.
   */
  const toggleSeason = () => {
    if (!tmdbId || episodes.length === 0) return;

    // Determine action: if complete, unmark; if incomplete, mark
    const shouldMark = !isCurrentlyComplete;

    const batchEpisodes: BatchEpisode[] = episodes.map((ep) => ({
      season: seasonNumber,
      episode: ep.episodeNumber,
      watched: shouldMark,
      runtime: ep.runtime ?? undefined,
    }));

    batchMutation.mutate({
      episodes: batchEpisodes,
    });
  };

  return {
    toggleSeason,
    isPending: batchMutation.isPending,
    isSuccess: batchMutation.isSuccess,
    error: batchMutation.error,
    reset: batchMutation.reset,
  };
}

/**
 * Hook for marking all episodes across all seasons
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @param seasons - Array of seasons with episode counts and runtimes
 */
export function useMarkAllEpisodes(
  tmdbId: number | null,
  seasons: Array<{
    seasonNumber: number;
    episodeCount: number;
    episodes?: Array<{ episodeNumber: number; runtime?: number | null }>;
  }>,
  seriesData?: BatchToggleVariables["seriesData"]
) {
  const batchMutation = useBatchEpisodeToggle(tmdbId);

  /**
   * Mark all episodes across all seasons
   */
  const markAll = () => {
    if (!tmdbId || seasons.length === 0) return;

    const batchEpisodes: BatchEpisode[] = [];

    for (const season of seasons) {
      if (season.episodes && season.episodes.length > 0) {
        for (const ep of season.episodes) {
          batchEpisodes.push({
            season: season.seasonNumber,
            episode: ep.episodeNumber,
            watched: true,
            runtime: ep.runtime ?? undefined,
          });
        }
      } else {
        // Fallback: assume episodes exist and use default runtime
        for (let epNum = 1; epNum <= season.episodeCount; epNum++) {
          batchEpisodes.push({
            season: season.seasonNumber,
            episode: epNum,
            watched: true,
            runtime: 0, // Default, will be 0 if not provided
          });
        }
      }
    }

    if (batchEpisodes.length > 0) {
      batchMutation.mutate({
        episodes: batchEpisodes,
        seriesData,
      });
    }
  };

  /**
   * Unmark all episodes across all seasons
   */
  const unmarkAll = () => {
    if (!tmdbId || seasons.length === 0) return;

    const batchEpisodes: BatchEpisode[] = [];

    for (const season of seasons) {
      if (season.episodes && season.episodes.length > 0) {
        for (const ep of season.episodes) {
          batchEpisodes.push({
            season: season.seasonNumber,
            episode: ep.episodeNumber,
            watched: false,
            runtime: ep.runtime ?? 0,
          });
        }
      } else {
        for (let epNum = 1; epNum <= season.episodeCount; epNum++) {
          batchEpisodes.push({
            season: season.seasonNumber,
            episode: epNum,
            watched: false,
            runtime: 0,
          });
        }
      }
    }

    if (batchEpisodes.length > 0) {
      batchMutation.mutate({
        episodes: batchEpisodes,
      });
    }
  };

  /**
   * Calculate total number of episodes across all seasons
   */
  const totalEpisodes = seasons.reduce(
    (sum, season) => sum + (season.episodeCount || 0),
    0
  );

  return {
    markAll,
    unmarkAll,
    isPending: batchMutation.isPending,
    isSuccess: batchMutation.isSuccess,
    error: batchMutation.error,
    reset: batchMutation.reset,
    totalEpisodes,
  };
}

