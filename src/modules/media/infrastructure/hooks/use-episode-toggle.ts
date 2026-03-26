

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleEpisode } from "@/modules/media/infrastructure/queries/episode-queries";
import { episodeKeys } from "./use-watched-episodes";
import { profileKeys } from "@/lib/query-client";
import type {
  WatchedEpisode,
  WatchedEpisodesResponse,
} from "@/modules/media/domain/episode.types";


export interface ToggleEpisodeVariables {
  
  season: number;
  
  episode: number;
  
  watched: boolean;
  
  runtime?: number;
}


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

      
      await queryClient.cancelQueries({
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

    onError: (error, variables, context) => {
      if (tmdbId === null) return;

      console.error("[useEpisodeToggle] Error:", error);

      
      if (context?.previousData) {
        queryClient.setQueryData<WatchedEpisodesResponse>(
          episodeKeys.watched(tmdbId),
          context.previousData
        );
      }
    },

      onSettled: (_data, error) => {
        if (tmdbId === null) return;

      
      queryClient.invalidateQueries({
        queryKey: episodeKeys.watched(tmdbId),
      });

      
      queryClient.invalidateQueries({
        queryKey: ["tv-status"],
      });

      
      queryClient.invalidateQueries({
        queryKey: profileKeys.all,
      });

      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(error ? 'episode-sync-error' : 'episode-sync-success', {
          detail: { tmdbId, success: !error },
        }));
      }
    },
  });
}


export function useOptimisticEpisodeToggle(tmdbId: number | null) {
  const queryClient = useQueryClient();

  return {
    
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

    
    rollback: (snapshot: { previousData?: WatchedEpisodesResponse }) => {
      if (tmdbId === null || !snapshot.previousData) return;

      queryClient.setQueryData<WatchedEpisodesResponse>(
        episodeKeys.watched(tmdbId),
        snapshot.previousData
      );
    },
  };
}


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

