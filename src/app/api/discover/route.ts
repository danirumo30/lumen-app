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
  sortDirection?: "asc" | "desc";
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

// Get popular movies - uses trending endpoint when no filters (like home)
async function getPopularMovies(filters?: SearchFilters, page: number = 1) {
  // If no filters, use trending endpoint (same as home page)
  const hasFilters = filters?.genre || filters?.yearFrom || filters?.yearTo || filters?.minRating || filters?.sortBy;
  
  if (!hasFilters) {
    // Use trending movies (same as home page)
    const trendingUrl = `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=es-ES&page=${page}`;
    
    const response = await fetch(trendingUrl, { 
      headers: { "Cache-Control": "public, s-maxage=3600" }
    });
    
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
    
    // Fetch providers for first 10 movies, return all 20
    const moviesWithProviders = await Promise.all(
      movies.map(async (movie: any, index: number) => {
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
  
  // Use discover/movie for filtered queries
  let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&language=es-ES`;
  
  if (filters?.genre) {
    // TMDB movie genres - complete list with correct IDs
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
  
  // Add sorting - default to popularity when filtering by genre/platform
  const sortFieldMap: Record<string, string> = {
    "popularity": "popularity",
    "rating": "vote_average",
    "year": "release_date",
    "relevance": "popularity"
  };
  
  if (filters?.sortBy && sortFieldMap[filters.sortBy]) {
    const direction = filters.sortDirection || "desc"; // Default to desc for backward compatibility
    url += `&sort_by=${sortFieldMap[filters.sortBy]}.${direction}`;
  } else if (filters?.genre || filters?.platform) {
    // Default to popularity when filtering
    url += "&sort_by=popularity.desc";
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

// Get popular TV - uses trending endpoint when no filters (like home)
async function getPopularTv(filters?: SearchFilters, page: number = 1) {
  // If no filters, use trending endpoint (same as home page)
  const hasFilters = filters?.genre || filters?.yearFrom || filters?.yearTo || filters?.minRating || filters?.sortBy;
  
  if (!hasFilters) {
    // Use trending TV (same as home page)
    const trendingUrl = `${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&language=es-ES&page=${page}`;
    
    const response = await fetch(trendingUrl, { 
      headers: { "Cache-Control": "public, s-maxage=3600" }
    });
    
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
    
    // Fetch providers for first 10 TV shows, return all 20
    const showsWithProviders = await Promise.all(
      shows.map(async (show: any, index: number) => {
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
  
  // Use discover/tv for filtered queries
  let url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&page=${page}&language=es-ES`;
  
  if (filters?.genre) {
    // TMDB TV genres - correct IDs for TV shows
    // TMDB TV genres - complete list with correct IDs (in Spanish)
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
  
  // Add sorting - default to popularity when filtering by genre/platform
  const sortFieldMap: Record<string, string> = {
    "popularity": "popularity",
    "rating": "vote_average",
    "year": "first_air_date",
    "relevance": "popularity"
  };
  
  if (filters?.sortBy && sortFieldMap[filters.sortBy]) {
    const direction = filters.sortDirection || "desc"; // Default to desc for backward compatibility
    url += `&sort_by=${sortFieldMap[filters.sortBy]}.${direction}`;
  } else if (filters?.genre || filters?.platform) {
    // Default to popularity when filtering
    url += "&sort_by=popularity.desc";
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
async function getPopularGames(filters?: SearchFilters, page: number = 1) {
  const token = await getIgdbToken();

  let queryBody = "fields id, name, cover.url, first_release_date, rating, genres.name, platforms.id, platforms.name, platforms.platform_logo.image_id;";
  
  // Genre ID mapping for IGDB - CORRECTED from official IGDB genres
  const genreIdMap: Record<string, number> = {
    "Acción": 4,          // Fighting (closest to action)
    "Aventura": 31,       // CORRECTED: Adventure is 31, not 3
    "RPG": 12,            // Role-playing (RPG)
    "Estrategia": 15,     // Strategy
    "Deportes": 14,       // Sport
    "Carreras": 10,       // Racing
    "Puzzle": 9,          // Puzzle
    "Horror": 13,         // Simulator (IGDB doesn't have horror, use Simulator)
    "Supervivencia": 36,  // MOBA (closest)
    "Lucha": 4,           // Fighting
    "Shooter": 5,         // Shooter
    "Plataformas": 8,     // Platform
    "Música": 7,          // Music
    "Arcade": 33,         // Arcade
    "Visual Novel": 34,   // Visual Novel
    "Simulación": 13,     // Simulator
  };
  
  // Platform ID mapping for IGDB - with MULTIPLE IDs per category
  // Using OR syntax: platforms = (id1 | id2 | id3)
  const igdbPlatformIdsMap: Record<string, number[]> = {
    "PlayStation": [48, 167, 169],    // PS4, PS5, PS3
    "Xbox": [49, 169, 14],            // Xbox One, Xbox Series X|S, Xbox 360
    "Nintendo": [130, 508, 137],      // Nintendo Switch, Switch 2, Wii U
    "PC": [6],                         // PC (Microsoft Windows)
    "Mobile": [39, 34],               // iOS, Android
    "Linux": [3],                      // Linux
    "Web": [16],                       // Web
    "PS4": [48],                       // PlayStation 4
    "PS5": [167],                      // PlayStation 5
    "Xbox One": [49],                  // Xbox One
    "Xbox Series X|S": [169],          // Xbox Series X|S
    "Nintendo Switch": [130],          // Nintendo Switch
    "Nintendo Switch 2": [508],        // Nintendo Switch 2
    "iOS": [39],                       // iOS
    "Android": [34],                   // Android
  };
  
  // Platform ID mapping for IGDB - expanded
  const igdbPlatformIdMap: Record<string, number> = {
    "PlayStation": 48,
    "Xbox": 49,
    "Nintendo": 130,
    "PC": 6,
    "Mobile": 4,
    "Linux": 3,
    "Web": 16,
    "PS4": 48,  // Additional mappings
    "PS5": 167,
    "Xbox One": 49,
    "Xbox Series X|S": 169,
    "Nintendo Switch": 130,
    "iOS": 39,
    "Android": 34
  };
  
  // Build where clause - IGDB syntax
  const conditions: string[] = [];
  
  // Always filter out games without release date for better UX
  conditions.push("first_release_date != null");
  
  // When filtering by genre/platform: show games from last 5 years
  if (filters?.genre || filters?.platform) {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const fiveYearsAgoTimestamp = Math.floor(fiveYearsAgo.getTime() / 1000);
    conditions.push(`first_release_date >= ${fiveYearsAgoTimestamp}`);
    // Don't require rating to show more results
  }
  
  // No filters: show recent popular games (last 1 year)
  if (!filters?.genre && !filters?.platform && !filters?.yearFrom && !filters?.yearTo) {
    conditions.push("rating != null");
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoTimestamp = Math.floor(oneYearAgo.getTime() / 1000);
    conditions.push(`first_release_date >= ${oneYearAgoTimestamp}`);
  }
  
  if (filters?.genre) {
    const genreId = genreIdMap[filters.genre];
    if (genreId) {
      conditions.push(`genres = ${genreId}`);
    }
  }
  if (filters?.platform) {
    const platformIds = igdbPlatformIdsMap[filters.platform];
    if (platformIds && platformIds.length > 0) {
      // Use OR syntax for multiple platform IDs: platforms = id1 | platforms = id2
      if (platformIds.length === 1) {
        conditions.push(`platforms = ${platformIds[0]}`);
      } else {
        // IGDB syntax: platforms = 130 | platforms = 508 (no parentheses)
        const platformConditions = platformIds.map(id => `platforms = ${id}`).join(" | ");
        conditions.push(`(${platformConditions})`);
      }
    }
  }
  if (filters?.yearFrom) {
    // Convert year to Unix timestamp (start of year)
    const fromTimestamp = Math.floor(new Date(`${filters.yearFrom}-01-01`).getTime() / 1000);
    conditions.push(`first_release_date >= ${fromTimestamp}`);
  }
  if (filters?.yearTo) {
    // Convert year to Unix timestamp (end of year)
    const toTimestamp = Math.floor(new Date(`${filters.yearTo}-12-31`).getTime() / 1000);
    conditions.push(`first_release_date <= ${toTimestamp}`);
  }
  if (filters?.minRating) {
    // IGDB rating is 0-100, filters.minRating is 0-10
    conditions.push(`rating >= ${filters.minRating * 10}`);
  }
  
  if (conditions.length > 0) {
    queryBody += " where " + conditions.join(" & ") + ";";
  }
  
  // Sorting - default to popularity for filtered queries
  let sortValue = "rating"; // Default to rating (proxy for popularity)
  
  if (filters?.sortBy === "rating") {
    sortValue = "rating";
  } else if (filters?.sortBy === "year") {
    sortValue = "first_release_date";
  } else if (filters?.sortBy === "popularity" || filters?.sortBy === "relevance") {
    sortValue = "rating"; // IGDB rating as popularity proxy
  } else if (filters?.genre || filters?.platform) {
    // When filtering by genre/platform, sort by rating (popularity proxy)
    sortValue = "rating";
  } else {
    // No filters: sort by release date (latest releases)
    sortValue = "first_release_date";
  }
  
  const direction = filters?.sortDirection || "desc"; // Default to desc for backward compatibility
  queryBody += " sort " + sortValue + " " + direction + ";";
  
  // Add offset for pagination (20 per page)
  const offset = (page - 1) * 20;
  if (offset > 0) {
    queryBody += ` offset ${offset};`;
  }

  queryBody += " limit 20;";
  
  console.log("IGDB query:", queryBody);
  console.log("IGDB token exists:", !!token);
  console.log("IGDB client ID exists:", !!IGDB_CLIENT_ID);

  try {
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
      const errorText = await response.text();
      console.error("IGDB error:", response.status, errorText);
      console.error("Failed query:", queryBody);
      return [];
    }

    const data = await response.json();
    console.log(`IGDB returned ${data.length} games`);
    
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
      voteAverage: game.rating ? Math.round(game.rating) / 10 : null,
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
  } catch (error) {
    console.error("Error fetching games from IGDB:", error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "all") as DiscoverType;
    const page = parseInt(searchParams.get("page") || "1");
    
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
      type === "all" || type === "movie" ? getPopularMovies(movieFilters, page) : Promise.resolve([]),
      type === "all" || type === "tv" ? getPopularTv(tvFilters, page) : Promise.resolve([]),
      type === "all" || type === "game" ? getPopularGames(gameFilters, page) : Promise.resolve([]),
    ]);

    const movies = results[0].status === "fulfilled" ? results[0].value : [];
    const tv = results[1].status === "fulfilled" ? results[1].value : [];
    const games = results[2].status === "fulfilled" ? results[2].value : [];

    return NextResponse.json({
      movies,
      tv,
      games,
      total: movies.length + tv.length + games.length,
      // Return pagination info from TMDB (movies and TV)
      pagination: {
        moviesTotal: movies.length,
        tvTotal: tv.length,
        gamesTotal: games.length,
      }
    });
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json(
      { error: "Discover failed" },
      { status: 500 }
    );
  }
}
