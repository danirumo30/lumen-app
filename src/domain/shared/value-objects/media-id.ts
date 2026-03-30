export type MediaProvider = "tmdb" | "igdb" | "movie" | "tv" | "game";

export class MediaId {
  public readonly value: string;

  private constructor(value: string) {
    if (!value) {
      throw new Error("MediaId cannot be empty");
    }
    if (!/^(tmdb|igdb|movie|tv|game)_[a-zA-Z0-9]+$/.test(value)) {
      throw new Error(`Invalid MediaId format: ${value}. Expected format: provider_id (e.g., tmdb_12345, movie_12345)`);
    }
    this.value = value;
  }

  static fromParts(provider: MediaProvider, id: string | number): MediaId {
    const idString = String(id);
    if (!idString) {
      throw new Error("ID cannot be empty");
    }
    return new MediaId(`${provider}_${idString}`);
  }

  static fromString(value: string): MediaId {
    return new MediaId(value);
  }

  static fromMediaTypeAndId(type: MediaType, id: number | string): MediaId {
    const idString = String(id);
    if (!idString) {
      throw new Error("ID cannot be empty");
    }
    const provider = type === "tv" ? "tv" : type === "game" ? "game" : "movie";
    return new MediaId(`${provider}_${idString}`);
  }

  get provider(): MediaProvider {
    const [provider] = this.value.split('_');
    if (provider === 'tmdb' || provider === 'igdb') {
      return provider as MediaProvider;
    }
    // Map movie/tv to tmdb, game to igdb
    if (provider === 'movie' || provider === 'tv') {
      return 'tmdb';
    }
    if (provider === 'game') {
      return 'igdb';
    }
    throw new Error(`Unknown provider: ${provider}`);
  }

  get providerId(): string {
    const parts = this.value.split('_');
    if (parts.length < 2) {
      throw new Error(`Invalid MediaId format: ${this.value}`);
    }
    return parts.slice(1).join('_');
  }

  equals(other: MediaId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// Type aliases para compatibilidad
export type TmdbMediaId = `tmdb_${string}`;
export type IgdbMediaId = `igdb_${string}`;
export type MediaIdType = "tmdb" | "igdb";

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
