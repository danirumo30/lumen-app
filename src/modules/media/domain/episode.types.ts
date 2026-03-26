


export interface WatchedEpisode {
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}


export interface WatchedEpisodesResponse {
  watchedEpisodes: WatchedEpisode[];
}


export interface EpisodeToggle {
  seasonNumber: number;
  episodeNumber: number;
  watched: boolean;
  runtime?: number;
}


export interface BatchEpisodeToggle {
  tvTmdId: number;
  episodes: EpisodeToggle[];
  markAll?: boolean;
}


export interface BatchToggleResponse {
  success: boolean;
  marked: number;
  errors: number;
}


export interface ToggleEpisodeVariables {
  season: number;
  episode: number;
  watched: boolean;
  runtime?: number;
}


export interface BatchToggleVariables {
  episodes: Array<{
    season: number;
    episode: number;
    watched: boolean;
    runtime?: number;
  }>;
}


export interface SeasonToggleVariables {
  seasonNumber: number;
  watched: boolean;
}


export function getEpisodeMediaId(tmdbId: number, season: number, episode: number): string {
  return `tv_${tmdbId}_s${season}_e${episode}`;
}


export function parseEpisodeMediaId(mediaId: string): WatchedEpisode | null {
  const match = mediaId.match(/^tv_(\d+)_s(\d+)_e(\d+)$/);
  if (!match) return null;
  
  return {
    tmdbId: parseInt(match[1], 10),
    seasonNumber: parseInt(match[2], 10),
    episodeNumber: parseInt(match[3], 10),
  };
}


export function mediaIdSetToWatchedEpisodes(
  mediaIds: Set<string>,
  tmdbId: number
): WatchedEpisode[] {
  const watched: WatchedEpisode[] = [];
  
  for (const mediaId of mediaIds) {
    const parsed = parseEpisodeMediaId(mediaId);
    if (parsed && parsed.tmdbId === tmdbId) {
      watched.push(parsed);
    }
  }
  
  return watched;
}


export function watchedEpisodesToMediaIdSet(
  episodes: WatchedEpisode[]
): Set<string> {
  const set = new Set<string>();
  
  for (const ep of episodes) {
    set.add(getEpisodeMediaId(ep.tmdbId, ep.seasonNumber, ep.episodeNumber));
  }
  
  return set;
}
