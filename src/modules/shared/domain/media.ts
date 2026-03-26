export type MediaProvider = "tmdb" | "igdb";

export type TmdbMediaId = `tmdb_${string}`;
export type IgdbMediaId = `igdb_${string}`;


export type MediaId = TmdbMediaId | IgdbMediaId;

export type MediaType = "movie" | "tv" | "game";

export type MediaTitle = string;

export type ReleaseYear = number;

export type MediaRuntimeMinutes = number;

export interface Media {
  readonly id: MediaId;
  readonly type: MediaType;
  readonly title: MediaTitle;
  readonly originalTitle?: MediaTitle;
  readonly releaseYear?: ReleaseYear;
  readonly runtimeMinutes?: MediaRuntimeMinutes;
  readonly posterUrl?: string;
  readonly rating?: number;
  readonly releaseDate?: string;
}

export type UserMediaStatusFlag = "favorite" | "watched" | "planned";

export type UserMediaRating = number;

export type MediaProgressMinutes = number;


export interface UserMediaState {
  readonly userId: string;
  readonly mediaId: MediaId;
  readonly mediaType: MediaType;
  readonly isFavorite: boolean;
  readonly isWatched: boolean;
  readonly isPlanned: boolean;
  readonly rating?: UserMediaRating;
  readonly progressMinutes?: MediaProgressMinutes;
  readonly hasPlatinum?: boolean;
  readonly statusFlags?: readonly UserMediaStatusFlag[];
}

export type MediaTypeForStats = "movie" | "tv" | "game";

export interface UserGlobalStats {
  readonly userId: string;
  readonly totalMovieMinutes: MediaProgressMinutes;
  readonly totalTvMinutes: MediaProgressMinutes;
  readonly totalGameMinutes: MediaProgressMinutes;
  readonly totalMinutes: MediaProgressMinutes;
  readonly totalEpisodesWatched: number;
  readonly totalMoviesWatched: number;
  readonly totalGamesPlayed: number;
  readonly totalGamesPlatinum: number;
}


