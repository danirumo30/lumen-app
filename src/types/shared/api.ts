


export interface PaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}


export type MediaType = 'movie' | 'tv' | 'game';


export interface BaseMedia {
  id: number;
  name?: string;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  first_air_date?: string;
  release_date?: string;
  genre_ids?: number[];
}

export interface Movie extends BaseMedia {
  title: string;
  release_date: string;
  adult: boolean;
  video: boolean;
}

export interface TVShow extends BaseMedia {
  name: string;
  first_air_date: string;
  origin_country: string[];
  original_language: string;
}

export interface Game {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number;
  total_rating?: number;
  total_rating_count?: number;
  cover?: { url: string };
  screenshots?: { url: string }[];
  genres?: { name: string }[];
  platforms?: Platform[];
  similar_games?: number[];
  themes?: { name: string }[];
  keywords?: { name: string }[];
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
  platform_logo?: {
    id: number;
    url: string;
  };
}


export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
  display_priority: number;
}

export interface WatchProvidersData {
  id: number;
  results: {
    [countryCode: string]: {
      flatrate?: WatchProvider[];
      buy?: WatchProvider[];
      rent?: WatchProvider[];
    };
  };
}


export interface ApiError {
  status_code: number;
  status_message: string;
  message?: string;
}


export interface TmdbConfig {
  images: {
    base_url: string;
    secure_base_url: string;
    backdrop_sizes: string[];
    logo_sizes: string[];
    poster_sizes: string[];
    profile_sizes: string[];
    still_sizes: string[];
  };
}


export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
