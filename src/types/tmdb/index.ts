/**
 * Complete TMDB API type definitions
 * Based on TMDB API v3 documentation
 */

export interface TmdbConfiguration {
  id: string;
  name: string;
  description: string;
  iso_3166_1: string;
  iso_639_1: string;
  public: boolean;
  official: boolean;
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  video: boolean;
  release_date: string;
  original_language: string;
  genre_ids: number[];
  status?: string;
  tagline?: string;
  success?: boolean;
}

export interface TmdbTv {
  id: number;
  name: string;
  original_name: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  first_air_date?: string;
  last_air_date?: string;
  origin_country: string[];
  original_language: string;
  genre_ids: number[];
  status?: string;
  tagline?: string;
  season_number?: number;
  episode_number?: number;
  type?: string;
}

export interface TmdbPerson {
  id: number;
  name: string;
  known_for_department?: string;
  profile_path?: string | null;
  known_for?: (TmdbMovie | TmdbTv)[];
  adult: boolean;
  gender?: number;
  birthday?: string;
  deathday?: string;
  place_of_birth?: string;
  popularity: number;
}

export interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
}

export interface TmdbWatchProvidersByCountry {
  flatrate?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
}

export interface TmdbWatchProvidersResult {
  id: number;
  results: {
    [countryCode: string]: TmdbWatchProvidersByCountry;
  };
}

export interface TmdbSearchResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbSimpleResponse {
  success: boolean;
}

export interface TmdbErrorResponse {
  status_code: number;
  status_message: string;
}

/**
 * Helper to build TMDB image URLs
 */
export function getTmdbImageUrl(path: string | null | undefined, size: string = 'original'): string | null {
  if (!path) return null;
  const baseUrl = "https://image.tmdb.org/t/p";
  return `${baseUrl}/${size}${path}`;
}
