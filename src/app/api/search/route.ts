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
  genres?: string[];
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  // Games
  platforms?: string[];
  // Users
  hasAvatar?: boolean;
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

// Search movies on TMDB
async function searchMovies(query: string, page = 1) {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`,
    { headers: { "Cache-Control": "public, s-maxage=600" } }
  );

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

// Search TV on TMDB
async function searchTv(query: string, page = 1) {
  const response = await fetch(
    `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=es-ES`,
    { headers: { "Cache-Control": "public, s-maxage=600" } }
  );

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

// Search games on IGDB
async function searchGames(query: string) {
  const token = await getIgdbToken();

  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body: `search "${query}"; fields id, name, cover.url, first_release_date, rating, genres.name, platforms.name; limit 20;`,
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
    .from("users")
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

    const results = await Promise.allSettled([
      type === "all" || type === "movie" ? searchMovies(query, page) : Promise.resolve([]),
      type === "all" || type === "tv" ? searchTv(query, page) : Promise.resolve([]),
      type === "all" || type === "game" ? searchGames(query) : Promise.resolve([]),
      type === "all" || type === "user" ? searchUsers(query, supabaseUrl, supabaseKey) : Promise.resolve([]),
    ]);

    const movies = results[0].status === "fulfilled" ? results[0].value : [];
    const tv = results[1].status === "fulfilled" ? results[1].value : [];
    const games = results[2].status === "fulfilled" ? results[2].value : [];
    const users = results[3].status === "fulfilled" ? results[3].value : [];

    // Apply filters
    let filteredMovies = movies;
    let filteredTv = tv;
    let filteredGames = games;

    if (filters.yearFrom || filters.yearTo) {
      const from = filters.yearFrom || 1900;
      const to = filters.yearTo || 2100;
      filteredMovies = filteredMovies.filter((m: { releaseDate?: string }) => {
        const year = m.releaseDate ? parseInt(m.releaseDate.split("-")[0]) : 0;
        return year >= from && year <= to;
      });
      filteredTv = filteredTv.filter((t: { releaseDate?: string }) => {
        const year = t.releaseDate ? parseInt(t.releaseDate.split("-")[0]) : 0;
        return year >= from && year <= to;
      });
    }

    if (filters.minRating) {
      filteredMovies = filteredMovies.filter((m: { voteAverage?: number }) => 
        (m.voteAverage || 0) >= filters.minRating!
      );
      filteredTv = filteredTv.filter((t: { voteAverage?: number }) => 
        (t.voteAverage || 0) >= filters.minRating!
      );
      filteredGames = filteredGames.filter((g: { rating?: number | null }) => 
        (g.rating || 0) >= filters.minRating!
      );
    }

    const totalResults = filteredMovies.length + filteredTv.length + filteredGames.length + users.length;

    return NextResponse.json({
      movies: filteredMovies,
      tv: filteredTv,
      games: filteredGames,
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
