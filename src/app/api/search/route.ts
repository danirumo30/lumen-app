import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { TmdbMovie, TmdbSearchResult, TmdbTv } from '@/types/tmdb';

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";


interface ProviderResult {
  id: number;
  name: string;
  logoUrl: string;
}

interface MovieResult {
  id: string;
  type: "movie";
  title: string;
  posterUrl: string | null;
  voteAverage: number;
  releaseDate: string;
  overview: string;
  providers?: ProviderResult[];
}

interface TvResult {
  id: string;
  type: "tv";
  title: string;
  posterUrl: string | null;
  voteAverage: number;
  releaseDate?: string;
  overview: string;
  providers?: ProviderResult[];
}

interface GameResult {
  id: string;
  type: "game";
  title: string;
  posterUrl: string | null;
  releaseDate: string | null;
  rating: number | null;
  genres: string[];
  platforms: string[];
  platformLogos: Array<{ id: number; name: string; platformName: string; logoUrl: string }>;
}

interface UserResult {
  id: string;
  type: "user";
  username: string;
  avatarUrl: string | null;
}

interface TmdbProviderItem {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
}

interface TmdbProvidersByCountry {
  flatrate?: TmdbProviderItem[];
  free?: TmdbProviderItem[];
  ads?: TmdbProviderItem[];
  rent?: TmdbProviderItem[];
  buy?: TmdbProviderItem[];
}

interface TmdbWatchProvidersData {
  id: number;
  results: {
    [countryCode: string]: TmdbProvidersByCountry;
  };
  link?: string;
}


interface UserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}


interface TmdbPaginatedResponse {
  total_pages: number;
}


const IGDB_GENRE_IDS: Record<string, number> = {
  "Acción": 4,
  "Aventura": 8,
  "RPG": 12,
  "Estrategia": 15,
  "Deportes": 13,
  "Carreras": 14,
  "Puzzle": 9,
  "Horror": 20,
  "Supervivencia": 35,
  "Lucha": 25
};

export const runtime = "nodejs";

type SearchType = "all" | "movie" | "tv" | "game" | "user";

interface SearchFilters {
  
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  platform?: string;
  sortBy?: "relevance" | "rating" | "year" | "popularity";
  sortDirection?: "asc" | "desc";
}

async function getIgdbToken(): Promise<string> {
  if (!IGDB_ACCESS_TOKEN) {
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: IGDB_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET || "",
        grant_type: "client_credentials",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get IGDB token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  }
  return IGDB_ACCESS_TOKEN;
}

async function getMovieProviders(movieId: number): Promise<ProviderResult[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
    if (!response.ok) return [];
    
    const data = await response.json() as TmdbWatchProvidersData;
    const country = "ES"; 
    const providers = data.results?.[country];
    
    if (!providers) return [];
    
    const allProviders: TmdbProviderItem[] = [
      ...(providers.flatrate || []),
      ...(providers.free || []),
      ...(providers.ads || []),
    ];
    
    
    const uniqueProviders = Array.from(new Map(allProviders.map((p) => [p.provider_id, p])).values());
    
    return uniqueProviders.slice(0, 5).map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
    })).filter((p): p is ProviderResult => Boolean(p.logoUrl));
  } catch {
    return [];
  }
}


async function searchMovies(query: string, page = 1, filters?: SearchFilters): Promise<MovieResult[]> {
  const hasQuery = query && query.trim().length >= 2;
  let url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;

  
  if (!hasQuery && filters?.genre) {
    const genreMap: Record<string, number> = {
      "Acción": 28, "Animación": 16, "Aventura": 12, "Bélica": 10752,
      "Ciencia ficción": 878, "Comedia": 35, "Crimen": 80, "Documental": 99,
      "Drama": 18, "Familia": 10751, "Fantasía": 14, "Historia": 36,
      "Misterio": 9648, "Música": 10402, "Película de TV": 10770,
      "Romance": 10749, "Suspense": 53, "Terror": 27, "Western": 37
    };
    if (genreMap[filters.genre]) {
      url += `&with_genres=${genreMap[filters.genre]}`;
    }
  }

  
  if (filters?.yearFrom) {
    if (hasQuery && !filters.yearTo) {
      url += `&year=${filters.yearFrom}`;
    } else if (!hasQuery) {
      url += `&primary_release_date.gte=${filters.yearFrom}-01-01`;
    }
  }
  if (!hasQuery && filters?.yearTo) {
    url += `&primary_release_date.lte=${filters.yearTo}-12-31`;
  }

  
  if (!hasQuery && filters?.minRating) {
    url += `&vote_average.gte=${filters.minRating}`;
  }

  if (filters?.sortBy) {
    const direction = filters.sortDirection || "desc";
    let sortField: string;
    if (hasQuery) {
      
      const searchSortMap: Record<string, string> = {
        "popularity": "popularity",
        "rating": "vote_count",
        "year": "release_date",
        "relevance": "popularity"
      };
      sortField = searchSortMap[filters.sortBy] || "popularity";
    } else {
      
      const discoverSortMap: Record<string, string> = {
        "popularity": "popularity",
        "rating": "vote_average",
        "year": "release_date",
        "relevance": "popularity"
      };
      sortField = discoverSortMap[filters.sortBy] || "popularity";
    }
    url += `&sort_by=${sortField}.${direction}`;
   } else if (!hasQuery && filters?.genre) {
     url += "&sort_by=popularity.desc";
   }

   const response = await fetch(url, { headers: { "Cache-Control": "public, s-maxage=600" } });

  if (!response.ok) {
    throw new Error(`TMDB movies error: ${response.status}`);
  }

  const data = await response.json() as TmdbSearchResult<TmdbMovie>;

  const movies = data.results?.map((movie) => ({
    id: `tmdb_${movie.id}`,
    type: "movie" as const,
    title: movie.title,
    posterUrl: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null,
    voteAverage: Math.round(movie.vote_average * 10) / 10,
    releaseDate: movie.release_date,
    overview: movie.overview || "",
  })) || [];

  const moviesWithProviders = await Promise.all(
    movies.slice(0, 10).map(async (movie, index) => {
      if (index < 10) {
        const tmdbId = movie.id.replace("tmdb_", "");
        const providers = await getMovieProviders(parseInt(tmdbId));
        return { ...movie, providers };
      }
      return movie;
    })
  );

  return moviesWithProviders;
}

async function getTvProviders(tvId: number): Promise<ProviderResult[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tvId}/watch/providers?api_key=${TMDB_API_KEY}`,
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
    if (!response.ok) return [];
    
    const data = await response.json() as TmdbWatchProvidersData;
    const country = "ES"; 
    const providers = data.results?.[country];
    
    if (!providers) return [];
    
    const allProviders: TmdbProviderItem[] = [
      ...(providers.flatrate || []),
      ...(providers.free || []),
      ...(providers.ads || []),
    ];
    
    
    const uniqueProviders = Array.from(new Map(allProviders.map((p) => [p.provider_id, p])).values());
    
    return uniqueProviders.slice(0, 5).map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
    })).filter((p): p is ProviderResult => Boolean(p.logoUrl));
  } catch {
    return [];
  }
}


async function searchTv(query: string, page = 1, filters?: SearchFilters): Promise<TvResult[]> {
  const hasQuery = query && query.trim().length >= 2;
  let url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;

  if (hasQuery) {
    url += "&sort_by=first_air_date.desc";
  }

  
  if (!hasQuery && filters?.genre) {
    const genreMap: Record<string, number> = {
      "Acción": 10759, "Animación": 16, "Comedia": 35, "Crimen": 80,
      "Documental": 99, "Drama": 18, "Familia": 10751, "Kids": 10762,
      "Misterio & Terror": 9648, "News": 10763, "Reality": 10764,
      "Sci-Fi & Fantasía": 10765, "Soap": 10766, "Talk": 10767,
      "Guerra y política": 10768, "Western": 37
    };
    if (genreMap[filters.genre]) {
      url += `&with_genres=${genreMap[filters.genre]}`;
    }
  }

  
  if (filters?.yearFrom) {
    if (hasQuery && !filters.yearTo) {
      url += `&first_air_date_year=${filters.yearFrom}`;
    } else if (!hasQuery) {
      url += `&first_air_date.gte=${filters.yearFrom}-01-01`;
    }
  }
  if (!hasQuery && filters?.yearTo) {
    url += `&first_air_date.lte=${filters.yearTo}-12-31`;
  }

  
  if (!hasQuery && filters?.minRating) {
    url += `&vote_average.gte=${filters.minRating}`;
  }

  if (filters?.sortBy) {
    const direction = filters.sortDirection || "desc";
    let sortField: string;
    if (hasQuery) {
      
      const searchSortMap: Record<string, string> = {
        "popularity": "popularity",
        "rating": "vote_count",
        "year": "first_air_date",
        "relevance": "popularity"
      };
      sortField = searchSortMap[filters.sortBy] || "popularity";
    } else {
      const discoverSortMap: Record<string, string> = {
        "popularity": "popularity",
        "rating": "vote_average",
        "year": "first_air_date",
        "relevance": "popularity"
      };
      sortField = discoverSortMap[filters.sortBy] || "popularity";
    }
    url += `&sort_by=${sortField}.${direction}`;
   } else if (!hasQuery && filters?.genre) {
     url += "&sort_by=popularity.desc";
   }

   const response = await fetch(url, { headers: { "Cache-Control": "public, s-maxage=600" } });

  if (!response.ok) {
    throw new Error(`TMDB TV error: ${response.status}`);
  }

  const data = await response.json() as TmdbSearchResult<TmdbTv>;

  const shows = data.results?.map((show) => ({
    id: `tmdb_${show.id}`,
    type: "tv" as const,
    title: show.name,
    posterUrl: show.poster_path
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
      : null,
    voteAverage: Math.round(show.vote_average * 10) / 10,
    releaseDate: show.first_air_date,
    overview: show.overview || "",
  })) || [];

  const showsWithProviders = await Promise.all(
    shows.slice(0, 10).map(async (show, index) => {
      if (index < 10) {
        const tmdbId = show.id.replace("tmdb_", "");
        const providers = await getTvProviders(parseInt(tmdbId));
        return { ...show, providers };
      }
      return show;
    })
  );

  return showsWithProviders;
}


async function searchGames(query: string, page: number = 1, filters?: SearchFilters) {
  const token = await getIgdbToken();

  
  const escapedQuery = query.replace(/"/g, '\\"');

  let whereClause = "";
  const conditions: string[] = [];
  
   if (filters?.genre && IGDB_GENRE_IDS[filters.genre]) {
     conditions.push(`genres = ${IGDB_GENRE_IDS[filters.genre]}`);
   }
   if (filters?.platform) {
     // Use ID mapping for reliable filtering (same as getPopularGames)
     const igdbPlatformIdsMap: Record<string, number[]> = {
       "PlayStation": [48, 167, 169],
       "Xbox": [49, 169, 14],
       "Nintendo": [130, 508, 137],
       "PC": [6],
       "Mobile": [39, 34],
       "Linux": [3],
       "Web": [16],
       "PS4": [48],
       "PS5": [167],
       "Xbox One": [49],
       "Xbox Series X|S": [169],
       "Nintendo Switch": [130],
       "Nintendo Switch 2": [508],
       "iOS": [39],
       "Android": [34]
     };
     const platformIds = igdbPlatformIdsMap[filters.platform];
     if (platformIds && platformIds.length > 0) {
       if (platformIds.length === 1) {
         conditions.push(`platforms = ${platformIds[0]}`);
       } else {
         const platformConditions = platformIds.map(id => `platforms = ${id}`).join(" | ");
         conditions.push(`(${platformConditions})`);
       }
     }
   }
  if (filters?.yearFrom) {
    const fromTimestamp = Math.floor(new Date(`${filters.yearFrom}-01-01`).getTime() / 1000);
    conditions.push(`first_release_date >= ${fromTimestamp}`);
  }
  if (filters?.yearTo) {
    const toTimestamp = Math.floor(new Date(`${filters.yearTo}-12-31`).getTime() / 1000);
    conditions.push(`first_release_date <= ${toTimestamp}`);
  }
  if (filters?.minRating) {
    conditions.push(`rating >= ${filters.minRating * 10}`);
  }
  
   if (conditions.length > 0) {
     whereClause = " where " + conditions.join(" & ") + ";";
   }
  
   // Sorting: only allowed when there is NO search query (IGDB error when both)
   let sortClause = "";
   if (filters?.sortBy && !query) {
     const direction = filters.sortDirection || "desc";
     let sortField: string;
     if (filters.sortBy === "rating") {
       sortField = "rating";
     } else if (filters.sortBy === "year") {
       sortField = "first_release_date";
     } else if (filters.sortBy === "popularity" || filters.sortBy === "relevance") {
       sortField = "rating";
     } else {
       sortField = "rating";
     }
     sortClause = ` sort ${sortField} ${direction};`;
   }
   
     // IGDB query format: search "term"; fields ...; where ...; sort ...; offset ...; limit ...;
    // Request platforms with logo info
    const offset = (page - 1) * 20;
    const offsetClause = offset > 0 ? ` offset ${offset};` : "";
    
    let queryBody = "";
    if (query && query.trim().length >= 2) {
      // Use search with offset - IGDB supports this in newer API versions
      queryBody = `search "${escapedQuery}"; fields id, name, cover.url, first_release_date, rating, genres.name, platforms.id, platforms.name, platforms.platform_logo.image_id; limit 20;${offsetClause}`;
    } else {
      // No query - use trending logic with offset for pagination
      queryBody = `fields id, name, cover.url, first_release_date, rating, genres.name, platforms.id, platforms.name, platforms.platform_logo.image_id;${whereClause}${sortClause}${offsetClause} limit 20;`;
    }

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: queryBody,
  });

  if (!response.ok) {
    logger.error("IGDB search error:", await response.text());
    return [];
  }

  const data = await response.json();
  return data.map((game: {
    id: number;
    name: string;
    cover?: { url: string };
    first_release_date?: number;
    rating?: number;
    genres?: { name: string }[];
    platforms?: { id: number; name: string; platform_logo?: { image_id: string } }[];
  }) => ({
    id: `igdb_${game.id}`,
    type: "game" as const,
    title: game.name,
    posterUrl: game.cover?.url
      ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
      : null,
    releaseDate: game.first_release_date
      ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
      : null,
    rating: game.rating ? Math.round(game.rating) / 10 : null,
    genres: game.genres?.map((g: { name: string }) => g.name) || [],
    platforms: game.platforms?.map((p: { name: string }) => p.name) || [],
    platformLogos: game.platforms?.map((p: { id: number; name: string; platform_logo?: { image_id: string } }) => ({
      id: p.id,
      name: p.name,
      // Use platform name for icon mapping (more reliable than ID)
      platformName: p.name,
      logoUrl: p.platform_logo?.image_id 
        ? `https://images.igdb.com/igdb/image/upload/t_micro/${p.platform_logo.image_id}.png`
        : null,
    })).filter((p: { logoUrl: string | null }) => p.logoUrl) || [],
  }));
}

async function searchUsers(query: string, supabaseUrl: string, supabaseKey: string, page: number = 1) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  
  if (!query || query.length === 0) {
    return [];
  }
  
  const offset = (page - 1) * 20;
  
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .eq("is_public", true)
    .ilike("username", `%${query}%`)
    .range(offset, offset + 19)
    .order("username", { ascending: true });

  if (error) {
    logger.error("[USER SEARCH] Error:", error);
    return [];
  }

  logger.debug("[USER SEARCH] Found users:", data?.length || 0);

  return data?.map((user: {
    id: string;
    username: string;
    avatar_url: string | null;
  }) => ({
    id: user.id,
    type: "user" as const,
    username: user.username,
    avatarUrl: user.avatar_url,
  })) || [];
}

async function getTrendingUsers(supabaseUrl: string, supabaseKey: string, page: number = 1): Promise<UserResult[]> {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const offset = (page - 1) * 20;
  
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .eq("is_public", true)
    .range(offset, offset + 19)
    .order("created_at", { ascending: false });

  if (profilesError || !profiles) {
    logger.error("Error fetching profiles:", profilesError);
    return [];
  }

  return profiles.map((user: UserProfile) => ({
    id: user.id,
    type: "user" as const,
    username: user.username,
    avatarUrl: user.avatar_url,
  }));
}

async function getTrendingMovies(filters?: SearchFilters, limit: number = 10) {
  try {
    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=es-ES&page=1&sort_by=popularity.desc`;

    const genreMap: Record<string, number> = {
      "Acción": 28,
      "Animación": 16,
      "Aventura": 12,
      "Bélica": 10752,
      "Ciencia ficción": 878,
      "Comedia": 35,
      "Crimen": 80,
      "Documental": 99,
      "Drama": 18,
      "Familia": 10751,
      "Fantasía": 14,
      "Historia": 36,
      "Misterio": 9648,
      "Música": 10402,
      "Película de TV": 10770,
      "Romance": 10749,
      "Suspense": 53,
      "Terror": 27,
      "Western": 37
    };

    if (filters?.genre && genreMap[filters.genre]) {
      url += `&with_genres=${genreMap[filters.genre]}`;
    }

    if (filters?.yearFrom) {
      url += `&primary_release_date.gte=${filters.yearFrom}-01-01`;
    }
    if (filters?.yearTo) {
      url += `&primary_release_date.lte=${filters.yearTo}-12-31`;
    }

    if (filters?.minRating) {
      url += `&vote_average.gte=${filters.minRating}`;
    }

    const response = await fetch(url, { headers: { "Cache-Control": "public, s-maxage=3600" } });

    if (!response.ok) {
      logger.error("TMDB discover movies error:", response.status);
      return [];
    }

    const data = await response.json();

    return data.results?.slice(0, limit).map((movie: {
      id: number;
      title: string;
      poster_path: string | null;
      vote_average: number;
      release_date: string;
    }) => ({
      id: `tmdb_${movie.id}`,
      type: "movie" as const,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      voteAverage: Math.round(movie.vote_average * 10) / 10,
      releaseDate: movie.release_date,
    })) || [];
  } catch (error) {
    logger.error("Error fetching trending movies:", error);
    return [];
  }
}

async function getTrendingTv(filters?: SearchFilters, limit: number = 10) {
  try {
    let url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=es-ES&page=1&sort_by=popularity.desc`;

    const genreMap: Record<string, number> = {
      "Acción": 10759,
      "Animación": 16,
      "Comedia": 35,
      "Crimen": 80,
      "Documental": 99,
      "Drama": 18,
      "Familia": 10751,
      "Kids": 10762,
      "Misterio & Terror": 9648,
      "News": 10763,
      "Reality": 10764,
      "Sci-Fi & Fantasía": 10765,
      "Soap": 10766,
      "Talk": 10767,
      "Guerra y política": 10768,
      "Western": 37
    };

    if (filters?.genre && genreMap[filters.genre]) {
      url += `&with_genres=${genreMap[filters.genre]}`;
    }

    if (filters?.yearFrom) {
      url += `&first_air_date.gte=${filters.yearFrom}-01-01`;
    }
    if (filters?.yearTo) {
      url += `&first_air_date.lte=${filters.yearTo}-12-31`;
    }

    if (filters?.minRating) {
      url += `&vote_average.gte=${filters.minRating}`;
    }

    const response = await fetch(url, { headers: { "Cache-Control": "public, s-maxage=3600" } });

    if (!response.ok) {
      logger.error("TMDB discover TV error:", response.status);
      return [];
    }

    const data = await response.json();

    return data.results?.slice(0, limit).map((show: {
      id: number;
      name: string;
      poster_path: string | null;
      vote_average: number;
      first_air_date: string;
    }) => ({
      id: `tmdb_${show.id}`,
      type: "tv" as const,
      title: show.name,
      posterUrl: show.poster_path
        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
        : null,
      voteAverage: Math.round(show.vote_average * 10) / 10,
      releaseDate: show.first_air_date,
    })) || [];
  } catch (error) {
    logger.error("Error fetching trending TV:", error);
    return [];
  }
}

async function getTrendingGames(filters?: SearchFilters, limit: number = 10) {
  try {
    const token = IGDB_ACCESS_TOKEN || await getIgdbToken();

    let whereClause = " where rating != null & first_release_date != null & first_release_date >= 1735689600";
    const conditions: string[] = [];

    if (filters?.genre) {
      conditions.push(`genres.name = "${filters.genre}"`);
    }
    if (filters?.platform) {
      conditions.push(`platforms.name = "${filters.platform}"`);
    }
    if (filters?.yearFrom) {
      const fromTimestamp = Math.floor(new Date(`${filters.yearFrom}-01-01`).getTime() / 1000);
      conditions.push(`first_release_date >= ${fromTimestamp}`);
    }
    if (filters?.yearTo) {
      const toTimestamp = Math.floor(new Date(`${filters.yearTo}-12-31`).getTime() / 1000);
      conditions.push(`first_release_date <= ${toTimestamp}`);
    }
    if (filters?.minRating) {
      conditions.push(`rating >= ${filters.minRating * 10}`);
    }

    if (conditions.length > 0) {
      whereClause += " & " + conditions.join(" & ");
    }

    let sortClause = " sort first_release_date desc";
    if (filters?.sortBy === "rating") {
      sortClause = " sort rating desc";
    } else if (filters?.sortBy === "popularity") {
      sortClause = " sort popularity desc";
    }

     // Request platforms with logo info
     const queryBody = `fields id, name, cover.url, first_release_date, rating, genres.name, platforms.id, platforms.name, platforms.platform_logo.image_id;${whereClause};${sortClause}; limit ${limit};`;

    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: queryBody,
    });

    if (!response.ok) {
      logger.error("IGDB discover games error:", response.status);
      return [];
    }

    const data = await response.json();

    return data.map((game: {
      id: number;
      name: string;
      cover?: { url: string };
      first_release_date?: number;
      rating?: number;
      genres?: { name: string }[];
      platforms?: { id: number; name: string; platform_logo?: { image_id: string } }[];
    }) => ({
      id: `igdb_${game.id}`,
      type: "game" as const,
      title: game.name,
      posterUrl: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
        : null,
      rating: game.rating ? Math.round(game.rating) / 10 : null,
      genres: game.genres?.map((g: { name: string }) => g.name) || [],
      platforms: game.platforms?.map((p: { name: string }) => p.name) || [],
      platformLogos: game.platforms?.map((p: { id: number; name: string; platform_logo?: { image_id: string } }) => ({
        id: p.id,
        name: p.name,
        platformName: p.name,
        logoUrl: p.platform_logo?.image_id
          ? `https://images.igdb.com/igdb/image/upload/t_micro/${p.platform_logo.image_id}.png`
          : null,
      })).filter((p: { logoUrl: string | null }) => p.logoUrl) || [],
    }));
  } catch (error) {
    logger.error("Error fetching trending games:", error);
    return [];
  }
}

// In-memory cache for total_pages (persists across requests in the same instance)
const pageCache = new Map<string, { moviePageCount: number; tvPageCount: number }>();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const type = (searchParams.get("type") || "all") as SearchType;
    const page = parseInt(searchParams.get("page") || "1");
    
    let filters: SearchFilters = {};
    const filtersStr = searchParams.get("filters");
    if (filtersStr) {
      try {
        filters = JSON.parse(filtersStr);
      } catch {}
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Only apply filters for the selected type
    const movieFilters = (type === "all" || type === "movie") ? filters : undefined;
    const tvFilters = (type === "all" || type === "tv") ? filters : undefined;
    const gameFilters = (type === "all" || type === "game") ? filters : undefined;

     // Determine if we should search 
     // - Movies/TV/Games: if has query, search. If no query and type=all, get trending. If no query and type=specific, get trending.
     const hasQuery = query && query.length >= 2;
     
   const cacheKey = `${query}_${type}`;
  const cached = pageCache.get(cacheKey);
  
  let movies: MovieResult[] = [];
  let tv: TvResult[] = [];
  let games: GameResult[] = [];
  let users: UserResult[] = [];
  let moviePageCount = cached?.moviePageCount || 1;
  let tvPageCount = cached?.tvPageCount || 1;
  
  if (hasQuery) {
    const results = await Promise.allSettled([
      (type === "all" || type === "movie") ? searchMovies(query, page, movieFilters) : Promise.resolve([]),
      (type === "all" || type === "tv") ? searchTv(query, page, tvFilters) : Promise.resolve([]),
      (type === "all" || type === "game") ? searchGames(query, page, gameFilters) : Promise.resolve([]),
      (type === "all" || type === "user") ? searchUsers(query, supabaseUrl, supabaseKey, page) : Promise.resolve([]),
    ]);

    movies = results[0].status === "fulfilled" ? results[0].value : [];
    tv = results[1].status === "fulfilled" ? results[1].value : [];
    games = results[2].status === "fulfilled" ? results[2].value : [];
    users = results[3].status === "fulfilled" ? results[3].value : [];

    // Only fetch on first page, then use cache for subsequent pages
    if (page === 1) {
      if (type === "all" || type === "movie") {
        const movieUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1&language=es-ES`;
        try {
          const movieRes = await fetch(movieUrl, { headers: { "Cache-Control": "public, s-maxage=600" } });
          const movieData = await movieRes.json() as TmdbPaginatedResponse;
          moviePageCount = movieData.total_pages || 1;
          pageCache.set(cacheKey, { moviePageCount, tvPageCount: cached?.tvPageCount || tvPageCount });
        } catch {}
      }
      if (type === "all" || type === "tv") {
        const tvUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1&language=es-ES`;
        try {
          const tvRes = await fetch(tvUrl, { headers: { "Cache-Control": "public, s-maxage=600" } });
          const tvData = await tvRes.json() as TmdbPaginatedResponse;
          tvPageCount = tvData.total_pages || 1;
          pageCache.set(cacheKey, { moviePageCount: cached?.moviePageCount || moviePageCount, tvPageCount });
        } catch {}
      }
    }
    } else {
      // Trending mode - get 10 of each type (with filters if provided)

      const trendingResults = await Promise.all([
        (type === "all" || type === "movie") ? getTrendingMovies(filters, 10) : Promise.resolve([]),
        (type === "all" || type === "tv") ? getTrendingTv(filters, 10) : Promise.resolve([]),
        (type === "all" || type === "game") ? getTrendingGames(filters, 10) : Promise.resolve([]),
        (type === "all" || type === "user") ? getTrendingUsers(supabaseUrl, supabaseKey, page) : Promise.resolve([]),
      ]);

      movies = trendingResults[0];
      tv = trendingResults[1];
      games = trendingResults[2];
      users = trendingResults[3];

    }

    const totalResults = movies.length + tv.length + games.length + users.length;

    // Calculate hasMore for each type
    const hasMore = {
      movies: (type === "all" || type === "movie") ? page < moviePageCount : false,
      tv: (type === "all" || type === "tv") ? page < tvPageCount : false,
      games: (type === "all" || type === "game") ? games.length >= 20 : false,
      users: (type === "all" || type === "user") ? users.length >= 20 : false,
    };

    return NextResponse.json({
      movies,
      tv,
      games,
      users,
      totalResults,
      hasMore,
    });
  } catch (error) {
    logger.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}




