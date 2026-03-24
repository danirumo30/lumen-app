import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";

type DiscoverType = "all" | "movie" | "tv" | "game";

interface SearchFilters {
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  platform?: string;
  sortBy?: "relevance" | "rating" | "year" | "popularity";
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
    const country = "ES";
    const providers = data.results?.[country];
    
    if (!providers) return [];
    
    const allProviders = [
      ...(providers.flatrate || []),
      ...(providers.free || []),
      ...(providers.ads || []),
    ];
    
    return allProviders.slice(0, 5).map((p: any) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
    })).filter((p: { logoUrl: string | null }): p is { id: number; name: string; logoUrl: string } => Boolean(p.logoUrl));
  } catch {
    return [];
  }
}

// Get popular movies
async function getPopularMovies(filters?: SearchFilters) {
  let url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=1&language=es-ES`;
  
  if (filters?.genre) {
    const genreMap: Record<string, number> = {
      "Acción": 28, "Comedia": 35, "Drama": 18, "Terror": 27, 
      "Ciencia Ficción": 878, "Romance": 10749, "Thriller": 53, 
      "Animación": 16, "Documental": 99, "Aventura": 12
    };
    if (genreMap[filters.genre]) {
      url += `&with_genres=${genreMap[filters.genre]}`;
    }
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
    throw new Error(`TMDB error: ${response.status}`);
  }

  const data = await response.json();
  const movies = data.results?.slice(0, 20).map((movie: {
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

  // Fetch providers for first 10 movies
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
    const country = "ES";
    const providers = data.results?.[country];
    
    if (!providers) return [];
    
    const allProviders = [
      ...(providers.flatrate || []),
      ...(providers.free || []),
      ...(providers.ads || []),
    ];
    
    return allProviders.slice(0, 5).map((p: any) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
    })).filter((p: { logoUrl: string | null }): p is { id: number; name: string; logoUrl: string } => Boolean(p.logoUrl));
  } catch {
    return [];
  }
}

// Get popular TV
async function getPopularTv(filters?: SearchFilters) {
  let url = `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=1&language=es-ES`;
  
  if (filters?.genre) {
    const genreMap: Record<string, number> = {
      "Drama": 18, "Comedia": 35, "Ciencia Ficción": 10765, "Terror": 10770, 
      "Acción": 10759, "Romance": 10749, "Thriller": 10768, "Documental": 99, "Animación": 16
    };
    if (genreMap[filters.genre]) {
      url += `&with_genres=${genreMap[filters.genre]}`;
    }
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
    throw new Error(`TMDB error: ${response.status}`);
  }

  const data = await response.json();
  const shows = data.results?.slice(0, 20).map((show: {
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

  // Fetch providers for first 10 TV shows
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

// Get popular games
async function getPopularGames(filters?: SearchFilters) {
  const token = await getIgdbToken();

  let queryBody = "fields id, name, cover.url, first_release_date, rating, genres.name, platforms.id, platforms.name, platforms.platform_logo.image_id;";
  
  // Build where clause
  const conditions: string[] = [];
  if (filters?.genre) {
    conditions.push(`genres.name = "${filters.genre}"`);
  }
  if (filters?.platform) {
    conditions.push(`platforms.name = "${filters.platform}"`);
  }
  if (filters?.yearFrom) {
    conditions.push(`first_release_date >= ${filters.yearFrom * 10000}`);
  }
  if (filters?.yearTo) {
    conditions.push(`first_release_date <= ${filters.yearTo * 10000}`);
  }
  if (filters?.minRating) {
    conditions.push(`rating >= ${filters.minRating * 10}`);
  }
  
  if (conditions.length > 0) {
    queryBody += " where " + conditions.join(" & ");
  }
  
  // Sorting
  if (filters?.sortBy === "rating") {
    queryBody += " sort rating desc;";
  } else if (filters?.sortBy === "year") {
    queryBody += " sort first_release_date desc;";
  } else {
    queryBody += " sort popularity desc;";
  }
  
  queryBody += " limit 20;";

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
    console.error("IGDB error:", await response.text());
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "all") as DiscoverType;
    
    let filters: SearchFilters = {};
    const filtersStr = searchParams.get("filters");
    if (filtersStr) {
      try {
        filters = JSON.parse(filtersStr);
      } catch {}
    }

    // Only apply filters for the selected type
    const movieFilters = (type === "all" || type === "movie") ? filters : undefined;
    const tvFilters = (type === "all" || type === "tv") ? filters : undefined;
    const gameFilters = (type === "all" || type === "game") ? filters : undefined;

    const results = await Promise.allSettled([
      type === "all" || type === "movie" ? getPopularMovies(movieFilters) : Promise.resolve([]),
      type === "all" || type === "tv" ? getPopularTv(tvFilters) : Promise.resolve([]),
      type === "all" || type === "game" ? getPopularGames(gameFilters) : Promise.resolve([]),
    ]);

    const movies = results[0].status === "fulfilled" ? results[0].value : [];
    const tv = results[1].status === "fulfilled" ? results[1].value : [];
    const games = results[2].status === "fulfilled" ? results[2].value : [];

    return NextResponse.json({
      movies,
      tv,
      games,
      total: movies.length + tv.length + games.length,
    });
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json(
      { error: "Discover failed" },
      { status: 500 }
    );
  }
}
