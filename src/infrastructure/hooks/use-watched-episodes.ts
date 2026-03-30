

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWatchedEpisodes } from "@/infrastructure/persistence/supabase/media/episode-queries";
import type { WatchedEpisodesResponse } from '@/application/media/dto/episode.dto';


export const episodeKeys = {
  
  all: ["episodes"] as const,
  
  
  watched: (tmdbId: number) => ["episodes", "watched", tmdbId] as const,
  
  
  detail: (tmdbId: number, season: number, episode: number) =>
    ["episodes", "detail", tmdbId, season, episode] as const,
};


export function useWatchedEpisodes(tmdbId: number | null) {
  return useQuery({
    
    queryKey: episodeKeys.watched(tmdbId ?? 0),
    queryFn: () => fetchWatchedEpisodes(tmdbId!),
    enabled: tmdbId !== null,
    
    
    
    staleTime: 0,                 
    gcTime: 5 * 60 * 1000,       
    
    
    refetchOnMount: true,
    
    retry: 1,
    
    
    refetchOnWindowFocus: false,
    
    
    refetchOnReconnect: false,
  });
}

export function useWatchedEpisodeSet(tmdbId: number | null) {
  const { data, ...rest } = useWatchedEpisodes(tmdbId);
  
  const watchedEpisodes = data?.watchedEpisodes;
  
  let watchedSet: Set<string>;
  if (!watchedEpisodes) {
    watchedSet = new Set<string>();
  } else {
    watchedSet = new Set<string>();
    for (const episode of watchedEpisodes) {
      const key = `tv_${episode.tmdbId}_s${episode.seasonNumber}_e${episode.episodeNumber}`;
      watchedSet.add(key);
    }
  }
  
  return { data: watchedSet, ...rest };
}


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








