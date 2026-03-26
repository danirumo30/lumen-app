/**
 * IGDB API types (based on IGDB schema v4+)
 */

export interface IgdbGame {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  first_release_date?: number; // Unix timestamp
  total_rating?: number;
  total_rating_count?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  status?: number; // 0=released, 1=alpha, etc.
  created_at?: number;
  updated_at?: number;
  url?: string;
  websites?: {
    category: number;
    url: string;
  }[];
  cover?: IgdbImage;
  screenshots?: IgdbImage[];
  artwork?: IgdbImage[];
  videos?: IgdbVideo[];
  genres?: IgdbGenre[];
  platforms?: IgdbPlatform[];
  themes?: IgdbTheme[];
  keywords?: IgdbKeyword[];
  similar_games?: number[]; // Array of game IDs
  dlcs?: number[];
  expansions?: number[];
  franchises?: IgdbFranchise[];
  game_engines?: IgdbGameEngine[];
  game_modes?: IgdbGameMode[];
  player_perspectives?: IgdbPlayerPerspective[];
  age_ratings?: IgdbAgeRating[];
  release_dates?: IgdbReleaseDate[];
  alternative_names?: IgdbAlternativeName[];
}

export interface IgdbImage {
  id: number;
  game: number;
  url: string;
  width: number;
  height: number;
  animated?: boolean;
  alpha_channel?: boolean;
}

export interface IgdbVideo {
  id: number;
  game: number;
  name: string;
  video_id: string;
}

export interface IgdbGenre {
  id: number;
  name: string;
  slug: string;
  created_at: number;
  updated_at: number;
}

export interface IgdbPlatform {
  id: number;
  abbreviation?: string;
  alternative_name?: string;
  category: number; // 1=console, 2=arcade, etc.
  created_at: number;
  name: string;
  platform_family?: string;
  platform_logo?: {
    id: number;
    url: string;
    width: number;
    height: number;
  };
  slug: string;
  updated_at: number;
  url?: string;
  checksum?: string;
}

export interface IgdbTheme {
  id: number;
  name: string;
  slug: string;
  created_at: number;
  updated_at: number;
}

export interface IgdbKeyword {
  id: number;
  name: string;
  slug: string;
  created_at: number;
  updated_at: number;
}

export interface IgdbFranchise {
  id: number;
  name: string;
  slug: string;
  created_at: number;
  updated_at: number;
  changed_company_id?: number;
}

export interface IgdbGameEngine {
  id: number;
  name: string;
  slug: string;
  created_at: number;
  updated_at: number;
}

export interface IgdbGameMode {
  id: number;
  name: string;
  slug: string;
  created_at: number;
  updated_at: number;
}

export interface IgdbPlayerPerspective {
  id: number;
  name: string;
  slug: string;
  created_at: number;
  updated_at: number;
}

export interface IgdbAgeRating {
  id: number;
  category: number;
  rating: number;
  rating_cover_url: string;
  synopsis: string;
  created_at: number;
  updated_at: number;
}

export interface IgdbReleaseDate {
  id: number;
  category: number;
  date: number;
  game: number;
  human: string;
  created_at: number;
  updated_at: number;
  platform?: {
    id: number;
    name: string;
    abbreviation: string;
    alternative_name: string;
    category: number;
    created_at: number;
    slug: string;
    updated_at: number;
    url?: string;
    checksum?: string;
  };
  region?: number;
  y?: number;
}

export interface IgdbAlternativeName {
  id: number;
  game: number;
  name: string;
  comment?: string;
  created_at: number;
  updated_at: number;
}

/**
 * TMDB genre mapping used in app
 */
export interface Genre {
  id: number;
  name: string;
}

/**
 * Combined meta structure for game responses
 */
export interface GameResponse {
  game: IgdbGame;
  platforms?: IgdbPlatform[];
  genres?: IgdbGenre[];
  themes?: IgdbTheme[];
}
