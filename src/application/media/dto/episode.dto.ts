import type { WatchedEpisode } from "../../../domain/media/value-objects/watched-episode.vo";

export type { WatchedEpisode };

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




