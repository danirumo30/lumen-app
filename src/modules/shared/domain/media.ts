export type MediaProvider = "tmdb" | "igdb";

export type TmdbMediaId = `tmdb_${string}`;
export type IgdbMediaId = `igdb_${string}`;

/**
 * Identificador único de una pieza de media dentro del dominio de Lumen.
 * Se basa en el identificador externo del proveedor, con un prefijo obligatorio.
 *
 * Ejemplos:
 * - "tmdb_603692" (The Matrix Resurrections en TMDB)
 * - "igdb_123456" (Un juego en IGDB)
 */
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
}

export type UserMediaStatusFlag = "favorite" | "watched" | "planned";

export type UserMediaRating = number;

export type MediaProgressMinutes = number;

/**
 * Estado de tracking de un usuario sobre una pieza de media concreta.
 * No contiene datos descriptivos de la media (título, carátula, etc.),
 * solo el vínculo usuario-media y su estado.
 */
export interface UserMediaState {
  readonly userId: string;
  readonly mediaId: MediaId;
  readonly mediaType: MediaType;
  readonly isFavorite: boolean;
  readonly isWatched: boolean;
  readonly isPlanned: boolean;
  readonly rating?: UserMediaRating;
  readonly progressMinutes?: MediaProgressMinutes;
  readonly statusFlags?: readonly UserMediaStatusFlag[];
}

export type MediaTypeForStats = "movie" | "tv" | "game";

export interface UserGlobalStats {
  readonly userId: string;
  readonly totalMovieMinutes: MediaProgressMinutes;
  readonly totalTvMinutes: MediaProgressMinutes;
  readonly totalGameMinutes: MediaProgressMinutes;
  readonly totalMinutes: MediaProgressMinutes;
}

