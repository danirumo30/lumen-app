

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleEpisodesBatch, updateSeriesWatchedStatus } from "@/infrastructure/persistence/supabase/media/episode-queries";
import { episodeKeys } from "./use-watched-episodes";
import { profileKeys } from "@/infrastructure/react-query/query-client";
import { WatchedEpisode } from '@/domain/media/value-objects/watched-episode.vo';
import type { WatchedEpisodesResponse } from '@/application/media/dto/episode.dto';


export interface BatchEpisode {
  
  season: number;
  
  episode: number;
  
  watched: boolean;
  
  runtime?: number;
}


export interface BatchToggleVariables {
  
  episodes: BatchEpisode[];
  
  seriesData?: {
    title: string;
    originalTitle: string;
    releaseYear: number | null;
    firstAirDate: string;
    posterPath: string | null;
  };
}


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
               .map((ep) => new WatchedEpisode(tmdbId, ep.season, ep.episode));

             return { watchedEpisodes };
           }

           const watchedSet = new Set<string>();
           for (const ep of old.watchedEpisodes) {
             watchedSet.add(ep.toMediaId());
           }

           for (const ep of variables.episodes) {
             const key = new WatchedEpisode(tmdbId, ep.season, ep.episode).toMediaId();
             if (ep.watched) {
               watchedSet.add(key);
             } else {
               watchedSet.delete(key);
             }
           }

           const watchedEpisodes: WatchedEpisode[] = [];
           for (const key of watchedSet) {
             const ep = WatchedEpisode.fromMediaId(key);
             if (ep) {
               watchedEpisodes.push(ep);
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

      
      queryClient.invalidateQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });

      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });
    },

    onSettled: () => {
      if (tmdbId === null) return;

      
      queryClient.invalidateQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });
    },
  });
}


export function useSeasonToggle(
  tmdbId: number | null,
  seasonNumber: number,
  episodes: Array<{ episodeNumber: number; runtime?: number | null }>,
  isCurrentlyComplete: boolean
) {
  const batchMutation = useBatchEpisodeToggle(tmdbId);

  
  const toggleSeason = () => {
    if (!tmdbId || episodes.length === 0) return;

    
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
        
        for (let epNum = 1; epNum <= season.episodeCount; epNum++) {
          batchEpisodes.push({
            season: season.seasonNumber,
            episode: epNum,
            watched: true,
            runtime: 0, 
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





