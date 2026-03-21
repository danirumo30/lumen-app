/**
 * Episode Tracking Domain Types
 * 
 * Episode media_id format: `tv_{tmdbId}_s{season}_e{episode}`
 * Example: tv_123_s1_e5 = TV show 123, season 1, episode 5
 */

/**
 * Represents a watched episode stored in the database
 */
export interface WatchedEpisode {
  tmdbId: number;
  seasonNumber: number;
  episodeNumber: number;
}

/**
 * Response from the episode-status API
 */
export interface WatchedEpisodesResponse {
  watchedEpisodes: WatchedEpisode[];
}

/**
 * Payload for toggling a single episode
 */
export interface EpisodeToggle {
  seasonNumber: number;
  episodeNumber: number;
  watched: boolean;
  runtime?: number;
}

/**
 * Payload for batch episode operations
 */
export interface BatchEpisodeToggle {
  tvTmdId: number;
  episodes: EpisodeToggle[];
  markAll?: boolean;
}

/**
 * Response from batch toggle operation
 */
export interface BatchToggleResponse {
  success: boolean;
  marked: number;
  errors: number;
}

/**
 * Mutation variables for single episode toggle
 */
export interface ToggleEpisodeVariables {
  season: number;
  episode: number;
  watched: boolean;
  runtime?: number;
}

/**
 * Mutation variables for batch episode toggle
 */
export interface BatchToggleVariables {
  episodes: Array<{
    season: number;
    episode: number;
    watched: boolean;
    runtime?: number;
  }>;
}

/**
 * Season toggle variables
 */
export interface SeasonToggleVariables {
  seasonNumber: number;
  watched: boolean;
}

/**
 * Helper to generate episode media_id
 */
export function getEpisodeMediaId(tmdbId: number, season: number, episode: number): string {
  return `tv_${tmdbId}_s${season}_e${episode}`;
}

/**
 * Helper to parse episode media_id back to components
 */
export function parseEpisodeMediaId(mediaId: string): WatchedEpisode | null {
  const match = mediaId.match(/^tv_(\d+)_s(\d+)_e(\d+)$/);
  if (!match) return null;
  
  return {
    tmdbId: parseInt(match[1], 10),
    seasonNumber: parseInt(match[2], 10),
    episodeNumber: parseInt(match[3], 10),
  };
}

/**
 * Convert Set of media_ids to WatchedEpisode array
 */
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

/**
 * Convert WatchedEpisode array to Set of media_ids
 */
export function watchedEpisodesToMediaIdSet(
  episodes: WatchedEpisode[]
): Set<string> {
  const set = new Set<string>();
  
  for (const ep of episodes) {
    set.add(getEpisodeMediaId(ep.tmdbId, ep.seasonNumber, ep.episodeNumber));
  }
  
  return set;
}
