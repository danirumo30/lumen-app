import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";

type SearchType = "all" | "movie" | "tv" | "game" | "user";

interface SearchFilters {
  // Movies/TV
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  // Games
  platform?: string;
  sortBy?: "relevance" | "rating" | "year" | "popularity";
  sortDirection?: "asc" | "desc";
}

interface SearchParams {
  q: string;
  type?: SearchType;
  filters?: SearchFilters;
  page?: number;
}

// Get IGDB access token
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

// Get streaming providers for a movie
async function getMovieProviders(movieId: number): Promise<{ id: number; name: string; logoUrl: string }[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
    if (!response.ok) return [];
    
    const data = await response.json();
    const country = "ES"; // Spain - can be made dynamic
    const providers = data.results?.[country];
    
    if (!providers) return [];
    
    // Get all provider types (flatrate, free, ads, rent, buy)
    const allProviders = [
      ...(providers.flatrate || []),
      ...(providers.free || []),
      ...(providers.ads || []),
    ];
    
    // Deduplicate by provider_id to avoid duplicate keys in UI
    const uniqueProviders = Array.from(new Map(allProviders.map((p: any) => [p.provider_id, p])).values());
    
    // Return top 5 providers with logos
    return uniqueProviders.slice(0, 5).map((p: any) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
    })).filter((p: { logoUrl: string | null }): p is { id: number; name: string; logoUrl: string } => Boolean(p.logoUrl));
  } catch {
    return [];
  }
}

// Search movies on TMDB with filters
async function searchMovies(query: string, page = 1, filters?: SearchFilters) {
  // Build TMDB query params
  let url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
  
  // Add genre filter if specified - complete mapping from DiscoverFilters.tsx
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
  
  // Add year filter
  if (filters?.yearFrom) {
    url += `&primary_release_date.gte=${filters.yearFrom}-01-01`;
  }
  if (filters?.yearTo) {
    url += `&primary_release_date.lte=${filters.yearTo}-12-31`;
  }
  
  // Add minimum rating
  if (filters?.minRating) {
    url += `&vote_average.gte=${filters.minRating}`;
  }

  const response = await fetch(url, { headers: { "Cache-Control": "public, s-maxage=600" } });

  if (!response.ok) {
    throw new Error(`TMDB movies error: ${response.status}`);
  }

  const data = await response.json();
  const movies = data.results?.map((movie: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    release_date: string;
    overview: string;
  }) => ({
    id: `tmdb_${movie.id}`,
    type: "movie" as const,
    title: movie.title,
    posterUrl: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null,
    voteAverage: Math.round(movie.vote_average * 10) / 10,
    releaseDate: movie.release_date,
    overview: movie.overview,
  })) || [];

  // Fetch providers for first 10 movies (to avoid too many API calls)
  const moviesWithProviders = await Promise.all(
    movies.slice(0, 10).map(async (movie: any, index: number) => {
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

// Get streaming providers for a TV show
async function getTvProviders(tvId: number): Promise<{ id: number; name: string; logoUrl: string }[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tvId}/watch/providers?api_key=${TMDB_API_KEY}`,
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
    if (!response.ok) return [];
    
    const data = await response.json();
    const country = "ES"; // Spain - can be made dynamic
    const providers = data.results?.[country];
    
    if (!providers) return [];
    
    // Get all provider types (flatrate, free, ads, rent, buy)
    const allProviders = [
      ...(providers.flatrate || []),
      ...(providers.free || []),
      ...(providers.ads || []),
    ];
    
    // Deduplicate by provider_id to avoid duplicate keys in UI
    const uniqueProviders = Array.from(new Map(allProviders.map((p: any) => [p.provider_id, p])).values());
    
    // Return top 5 providers with logos
    return uniqueProviders.slice(0, 5).map((p: any) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
    })).filter((p: { logoUrl: string | null }): p is { id: number; name: string; logoUrl: string } => Boolean(p.logoUrl));
  } catch {
    return [];
  }
}

// Search TV on TMDB with filters
async function searchTv(query: string, page = 1, filters?: SearchFilters) {
  let url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
  
  // Genre map for TV - synchronized with DiscoverFilters.tsx
  const genreMap: Record<string, number> = {
    "Acción": 10759,
    "Animación": 16,
    "Comedia": 35,
    "Crimen": 80,
    "Documental": 99,
    "Drama": 18,
    "Familia": 10751,
    "Kids": 10762,
    "Misterio & Terror": 9648, // Maps to Mystery which includes horror
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

  const response = await fetch(url, { headers: { "Cache-Control": "public, s-maxage=600" } });

  if (!response.ok) {
    throw new Error(`TMDB TV error: ${response.status}`);
  }

  const data = await response.json();
  const shows = data.results?.map((show: {
    id: number;
    name: string;
    poster_path: string | null;
    vote_average: number;
    first_air_date: string;
    overview: string;
  }) => ({
    id: `tmdb_${show.id}`,
    type: "tv" as const,
    title: show.name,
    posterUrl: show.poster_path
      ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
      : null,
    voteAverage: Math.round(show.vote_average * 10) / 10,
    releaseDate: show.first_air_date,
    overview: show.overview,
  })) || [];

  // Fetch providers for first 10 TV shows (to avoid too many API calls)
  const showsWithProviders = await Promise.all(
    shows.slice(0, 10).map(async (show: any, index: number) => {
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

// Search games on IGDB with filters
async function searchGames(query: string, page: number = 1, filters?: SearchFilters) {
  const token = await getIgdbToken();

  // Build IGDB query - fields first, then where, then sort
  let whereClause = "";
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
    whereClause = " where " + conditions.join(" & ");
  }
  
   // Sorting
   let sortClause = "";
   if (filters?.sortBy) {
     const direction = filters.sortDirection || "desc";
     let sortField: string;
     if (filters.sortBy === "rating") {
       sortField = "rating";
     } else if (filters.sortBy === "year") {
       sortField = "first_release_date";
     } else if (filters.sortBy === "popularity" || filters.sortBy === "relevance") {
       sortField = "rating"; // IGDB rating as popularity proxy
     } else {
       sortField = "rating"; // default
     }
     sortClause = ` sort ${sortField} ${direction};`;
   }
  
  // IGDB query format: search "term"; fields ...; where ...; sort ...; offset ...; limit ...;
  // Request platforms with logo info
  const offset = (page - 1) * 20;
  const offsetClause = offset > 0 ? ` offset ${offset};` : "";
  const queryBody = `search "${query}"; fields id, name, cover.url, first_release_date, rating, genres.name, platforms.id, platforms.name, platforms.platform_logo.image_id;${whereClause}${sortClause}${offsetClause} limit 20;`;

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
    console.error("IGDB search error:", await response.text());
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

// Search users on Supabase
async function searchUsers(query: string, supabaseUrl: string, supabaseKey: string, page: number = 1) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log("[USER SEARCH] Searching for:", query, "page:", page);
  
  // If no query, return empty (use trending users instead)
  if (!query || query.length === 0) {
    console.log("[USER SEARCH] No query, returning empty (use trending)");
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
    console.error("[USER SEARCH] Error:", error);
    return [];
  }

  console.log("[USER SEARCH] Found users:", data?.length || 0);

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

// Get trending users with pagination
async function getTrendingUsers(supabaseUrl: string, supabaseKey: string, page: number = 1) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const offset = (page - 1) * 20;
  
  // Get public user profiles with pagination
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .eq("is_public", true)
    .range(offset, offset + 19)
    .order("created_at", { ascending: false });

  if (profilesError || !profiles) {
    console.error("Error fetching profiles:", profilesError);
    return [];
  }

  return profiles.map((user: any) => ({
    id: user.id,
    type: "user" as const,
    username: user.username,
    avatarUrl: user.avatar_url,
  }));
}

// Get trending movies (recent releases) with optional filters
async function getTrendingMovies(filters?: SearchFilters, limit: number = 10) {
  try {
    // Build discover URL with filters if provided
    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=es-ES&page=1&sort_by=popularity.desc`;

    // Add genre filter if specified
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

    // Add year filter
    if (filters?.yearFrom) {
      url += `&primary_release_date.gte=${filters.yearFrom}-01-01`;
    }
    if (filters?.yearTo) {
      url += `&primary_release_date.lte=${filters.yearTo}-12-31`;
    }

    // Add minimum rating
    if (filters?.minRating) {
      url += `&vote_average.gte=${filters.minRating}`;
    }

    const response = await fetch(url, { headers: { "Cache-Control": "public, s-maxage=3600" } });

    if (!response.ok) {
      console.error("TMDB discover movies error:", response.status);
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
    console.error("Error fetching trending movies:", error);
    return [];
  }
}

// Get trending TV shows (airing now) with optional filters
async function getTrendingTv(filters?: SearchFilters, limit: number = 10) {
  try {
    // Build discover URL with filters if provided
    let url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=es-ES&page=1&sort_by=popularity.desc`;

    // Add genre filter if specified
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

    // Add year filter
    if (filters?.yearFrom) {
      url += `&first_air_date.gte=${filters.yearFrom}-01-01`;
    }
    if (filters?.yearTo) {
      url += `&first_air_date.lte=${filters.yearTo}-12-31`;
    }

    // Add minimum rating
    if (filters?.minRating) {
      url += `&vote_average.gte=${filters.minRating}`;
    }

    const response = await fetch(url, { headers: { "Cache-Control": "public, s-maxage=3600" } });

    if (!response.ok) {
      console.error("TMDB discover TV error:", response.status);
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
    console.error("Error fetching trending TV:", error);
    return [];
  }
}

// Get trending games (recent releases) with optional filters
async function getTrendingGames(filters?: SearchFilters, limit: number = 10) {
  try {
    const token = IGDB_ACCESS_TOKEN || await getIgdbToken();

    // Build IGDB query with filters if provided
    let whereClause = " where first_release_date != null";
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

    // Sorting
    let sortClause = " sort first_release_date desc";
    if (filters?.sortBy === "rating") {
      sortClause = " sort rating desc";
    } else if (filters?.sortBy === "popularity") {
      sortClause = " sort popularity desc";
    }

    // Request platforms with logo info
    const offset = 0; // No pagination for trending
    const queryBody = `fields id, name, cover.url, first_release_date, rating, genres.name, platforms.id, platforms.name, platforms.platform_logo.image_id;${whereClause}${sortClause} limit ${limit};`;

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
      console.error("IGDB discover games error:", response.status);
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
    console.error("Error fetching trending games:", error);
    return [];
  }
}

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
    const isAll = type === "all";
    
    // For "all" without query: get trending content (10 each) + random users
    // For "all" with query: search all types
    // For specific types: search or get trending
    
    const shouldSearchMoviesTvGames = hasQuery;
    const hasUserQuery = query && query.length >= 1;
    const needsTrendingUsers = !query && (type === "user" || isAll);
    const needsTrendingContent = !hasQuery && (type !== "user");
    
    console.log("[SEARCH] query:", query, "type:", type, "hasQuery:", hasQuery, "isAll:", isAll, "needsTrendingUsers:", needsTrendingUsers, "needsTrendingContent:", needsTrendingContent);

    // Fetch data - search or trending depending on query
    let movies: any[] = [];
    let tv: any[] = [];
    let games: any[] = [];
    let users: any[] = [];
    
    if (hasQuery) {
      // Search mode
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
    } else {
      // Trending mode - get 10 of each type (with filters if provided)
      console.log("[SEARCH] Fetching trending content with filters:", !!filters);

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

      console.log("[SEARCH] Trending - movies:", movies.length, "tv:", tv.length, "games:", games.length, "users:", users.length);
    }

    const totalResults = movies.length + tv.length + games.length + users.length;

    return NextResponse.json({
      movies,
      tv,
      games,
      users,
      totalResults,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
