/**
 * Episode API Query Functions
 * 
 * Handles all communication with the /api/user/episode-status endpoint.
 */

import { supabase } from "@/lib/supabase";
import type {
  WatchedEpisode,
  WatchedEpisodesResponse,
  EpisodeToggle,
  BatchToggleResponse,
} from "@/modules/media/domain/episode.types";

/**
 * Get authorization headers with current session token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  
  return headers;
}

/**
 * Fetch all watched episodes for a TV show
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @returns Array of watched episodes with season and episode numbers
 */
export async function fetchWatchedEpisodes(
  tmdbId: number
): Promise<WatchedEpisodesResponse> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(
    `/api/user/episode-status?tmdbId=${tmdbId}`,
    { headers }
  );
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to fetch watched episodes");
  }
  
  const data = await response.json();
  return data;
}

/**
 * Toggle a single episode's watched status
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @param season - Season number
 * @param episode - Episode number
 * @param watched - Whether to mark as watched or not
 * @param runtime - Episode runtime in minutes (for stats calculation)
 */
export async function toggleEpisode(
  tmdbId: number,
  season: number,
  episode: number,
  watched: boolean,
  runtime?: number
): Promise<BatchToggleResponse> {
  const headers = await getAuthHeaders();
  
  const response = await fetch("/api/user/episode-status", {
    method: "POST",
    headers,
    body: JSON.stringify({
      tvTmdId: tmdbId,
      episodes: [
        {
          seasonNumber: season,
          episodeNumber: episode,
          watched,
          runtime: runtime ?? 0,
        },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to toggle episode");
  }
  
  return response.json();
}

/**
 * Toggle multiple episodes at once (batch operation)
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @param episodes - Array of episode toggles
 * @returns Batch operation result
 */
export async function toggleEpisodesBatch(
  tmdbId: number,
  episodes: EpisodeToggle[]
): Promise<BatchToggleResponse> {
  if (episodes.length === 0) {
    return { success: true, marked: 0, errors: 0 };
  }
  
  const headers = await getAuthHeaders();
  
  const response = await fetch("/api/user/episode-status", {
    method: "POST",
    headers,
    body: JSON.stringify({
      tvTmdId: tmdbId,
      episodes,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to batch toggle episodes");
  }
  
  return response.json();
}

/**
 * Mark or unmark all episodes for a TV show
 * 
 * @param tmdbId - The TMDB ID of the TV show
 * @param episodeDetails - Array with season, episode, and runtime for each episode
 * @param mark - Whether to mark all (true) or unmark all (false)
 */
export async function toggleAllEpisodes(
  tmdbId: number,
  episodeDetails: Array<{
    seasonNumber: number;
    episodeNumber: number;
    runtime?: number;
  }>,
  mark: boolean
): Promise<BatchToggleResponse> {
  const episodes: EpisodeToggle[] = episodeDetails.map((ep) => ({
    seasonNumber: ep.seasonNumber,
    episodeNumber: ep.episodeNumber,
    watched: mark,
    runtime: ep.runtime ?? 0,
  }));
  
  return toggleEpisodesBatch(tmdbId, episodes);
}

/**
 * Update series watched status (marks the series as "started watching")
 * This is separate from episode tracking
 */
export async function updateSeriesWatchedStatus(
  tmdbId: number,
  watched: boolean,
  seriesData?: {
    title: string;
    originalTitle: string;
    releaseYear: number | null;
    firstAirDate: string;
    posterPath: string | null;
  }
): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch("/api/user/tv-status", {
    method: "POST",
    headers,
    body: JSON.stringify({
      tmdbId,
      watched,
      tvData: seriesData,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to update series status");
  }
}
