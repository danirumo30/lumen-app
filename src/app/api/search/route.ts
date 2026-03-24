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

// Search movies on TMDB with filters
async function searchMovies(query: string, page = 1, filters?: SearchFilters) {
  // Build TMDB query params
  let url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
  
  // Add genre filter if specified
  const genreMap: Record<string, number> = {
    "Acción": 28, "Comedia": 35, "Drama": 18, "Terror": 27, 
    "Ciencia Ficción": 878, "Romance": 10749, "Thriller": 53, 
    "Animación": 16, "Documental": 99, "Aventura": 12
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
  return data.results?.map((movie: {
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
}

// Search TV on TMDB with filters
async function searchTv(query: string, page = 1, filters?: SearchFilters) {
  let url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`;
  
  // Genre map for TV
  const genreMap: Record<string, number> = {
    "Drama": 18, "Comedia": 35, "Ciencia Ficción": 10765, "Terror": 10770, 
    "Acción": 10759, "Romance": 10749, "Thriller": 10768, "Documental": 99, "Animación": 16
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
  return data.results?.map((show: {
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
}

// Search games on IGDB with filters
async function searchGames(query: string, filters?: SearchFilters) {
  const token = await getIgdbToken();

  // Build IGDB query
  let queryBody = `search "${query}";`;
  
  // Add filters
  if (filters?.genre) {
    queryBody += ` where genres.name = "${filters.genre}";`;
  }
  if (filters?.platform) {
    queryBody += ` where platforms.name = "${filters.platform}";`;
  }
  if (filters?.yearFrom) {
    queryBody += ` where first_release_date >= ${filters.yearFrom * 10000};`;
  }
  if (filters?.yearTo) {
    queryBody += ` where first_release_date <= ${filters.yearTo * 10000};`;
  }
  if (filters?.minRating) {
    queryBody += ` where rating >= ${filters.minRating * 10};`;
  }
  
  // Sorting
  if (filters?.sortBy === "rating") {
    queryBody += " sort rating desc;";
  } else if (filters?.sortBy === "year") {
    queryBody += " sort first_release_date desc;";
  } else {
    queryBody += " sort popularity desc;";
  }
  
  queryBody += " fields id, name, cover.url, first_release_date, rating, genres.name, platforms.name; limit 20;";

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
    platforms?: { name: string }[];
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
  }));
}

// Search users on Supabase
async function searchUsers(query: string, supabaseUrl: string, supabaseKey: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .ilike("username", `%${query}%`)
    .eq("is_public", true)
    .limit(20);

  if (error) {
    console.error("User search error:", error);
    return [];
  }

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

    if (!query || query.length < 2) {
      return NextResponse.json({ movies: [], tv: [], games: [], users: [], totalResults: 0 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Only apply filters for the selected type
    const movieFilters = (type === "all" || type === "movie") ? filters : undefined;
    const tvFilters = (type === "all" || type === "tv") ? filters : undefined;
    const gameFilters = (type === "all" || type === "game") ? filters : undefined;

    const results = await Promise.allSettled([
      type === "all" || type === "movie" ? searchMovies(query, page, movieFilters) : Promise.resolve([]),
      type === "all" || type === "tv" ? searchTv(query, page, tvFilters) : Promise.resolve([]),
      type === "all" || type === "game" ? searchGames(query, gameFilters) : Promise.resolve([]),
      type === "all" || type === "user" ? searchUsers(query, supabaseUrl, supabaseKey) : Promise.resolve([]),
    ]);

    const movies = results[0].status === "fulfilled" ? results[0].value : [];
    const tv = results[1].status === "fulfilled" ? results[1].value : [];
    const games = results[2].status === "fulfilled" ? results[2].value : [];
    const users = results[3].status === "fulfilled" ? results[3].value : [];

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
