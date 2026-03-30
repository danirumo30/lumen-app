

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleEpisode } from "@/infrastructure/persistence/supabase/media/episode-queries";
import { episodeKeys } from "./use-watched-episodes";
import { profileKeys } from "@/infrastructure/react-query/query-client";
import { WatchedEpisode } from '@/domain/media/value-objects/watched-episode.vo';
import type { WatchedEpisodesResponse } from '@/application/media/dto/episode.dto';


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

       // Removed unused episodeKey variable
       
       queryClient.setQueryData<WatchedEpisodesResponse>(
         episodeKeys.watched(tmdbId),
         (old) => {
           if (!old) {
             return {
               watchedEpisodes: variables.watched
                 ? [new WatchedEpisode(tmdbId, variables.season, variables.episode)]
                 : [],
             };
           }

           const watchedSet = new Set<string>();
           for (const ep of old.watchedEpisodes) {
             watchedSet.add(ep.toMediaId());
           }

           const episodeVO = new WatchedEpisode(tmdbId, variables.season, variables.episode);
           if (variables.watched) {
             watchedSet.add(episodeVO.toMediaId());
           } else {
             watchedSet.delete(episodeVO.toMediaId());
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

       // Removed unused episodeKey variable
       queryClient.setQueryData<WatchedEpisodesResponse>(
        episodeKeys.watched(tmdbId),
        (old) => {
          if (!old) {
            return {
              watchedEpisodes: variables.watched
                ? [new WatchedEpisode(tmdbId, variables.season, variables.episode)]
                : [],
            };
          }

          const watchedSet = new Set<string>();
          for (const ep of old.watchedEpisodes) {
            watchedSet.add(ep.toMediaId());
          }

          const episodeVO = new WatchedEpisode(tmdbId, variables.season, variables.episode);
          if (variables.watched) {
            watchedSet.add(episodeVO.toMediaId());
          } else {
            watchedSet.delete(episodeVO.toMediaId());
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





