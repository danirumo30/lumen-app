import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { TmdbWatchProvidersByCountry, TmdbWatchProvider, TmdbMovie } from '@/types/tmdb';

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
  providerIds?: number[]; 
  sortBy?: "relevance" | "rating" | "year" | "popularity";
  sortDirection?: "asc" | "desc";
  accessType?: string;
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

type TvWithProviders = {
  id: string;
  type: "tv";
  title: string;
  posterUrl: string | null;
  voteAverage: number;
  releaseDate: string;
  overview: string;
  providers?: { id: number; name: string; logoUrl: string | null; type: string }[];
};

type MovieWithProviders = {
  id: string;
  type: "movie";
  title: string;
  posterUrl: string | null;
  voteAverage: number;
  releaseDate: string;
  overview: string;
  providers?: { id: number; name: string; logoUrl: string | null; type: string }[];
};

interface ProviderWithType {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
  type: 'flatrate' | 'free' | 'ads' | 'rent' | 'buy';
}

async function getMovieProviders(movieId: number): Promise<{ id: number; name: string; logoUrl: string | null; type: string }[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
    if (!response.ok) return [];
    
    const data = await response.json() as { results: { [country: string]: TmdbWatchProvidersByCountry } };
    const country = "ES";
    const providers = data.results?.[country];
    
    if (!providers) return [];
    
    
    const allProviders: ProviderWithType[] = [
      ...(providers.flatrate || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'flatrate' })),
      ...(providers.free || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'free' })),
      ...(providers.ads || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'ads' })),
      ...(providers.rent || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'rent' })),
      ...(providers.buy || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'buy' })),
    ];
    
    
    const uniqueProviders = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values());
    
    return uniqueProviders.slice(0, 5).map(p => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
      type: p.type,
    }));
  } catch {
    return [];
  }
}

async function getPopularMovies(filters?: SearchFilters, page: number = 1, query?: string) {
    if (query && query.trim().length > 0) {
      console.log("[DEBUG] Using search endpoint for movies with query:", query);
      let searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&language=es-ES&page=${page}&query=${encodeURIComponent(query)}`;
      
      if (filters?.yearFrom) {
        searchUrl += `&year=${filters.yearFrom}`;
      }
      
    
    const response = await fetch(searchUrl, { headers: { "Cache-Control": "public, s-maxage=3600" } });
    if (!response.ok) {
      throw new Error(`TMDB search error: ${response.status}`);
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
      providers: [], 
    })) || [];
    
    return movies;
  }

  const hasFilters = filters?.genre || filters?.yearFrom || filters?.yearTo || filters?.minRating || filters?.sortBy || (filters?.providerIds && filters.providerIds.length > 0) || filters?.accessType;
  
  if (filters?.providerIds && filters.providerIds.length > 0) {
    console.log("[DEBUG] getPopularMovies - providerIds:", filters.providerIds, "hasFilters:", hasFilters);
  }
  
  if (!hasFilters) {
    
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

      interface MovieWithProviders {
        id: string;
        type: "movie";
        title: string;
        posterUrl: string | null;
        voteAverage: number;
        releaseDate: string;
        overview: string;
        providers?: { id: number; name: string; logoUrl: string | null; type: string }[];
      }

      const moviesWithProviders = await Promise.all(
        movies.map(async (movie: MovieWithProviders, index: number) => {
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
  
    
    let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&page=${page}&language=es-ES&region=ES&watch_region=ES`;
    console.log("[DEBUG] Using discover endpoint. Filters:", JSON.stringify(filters));

    if (filters?.genre) {
     
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
    if (filters?.providerIds && filters.providerIds.length > 0) {
      
      const providerIdsStr = filters.providerIds.join('|');
      url += `&with_watch_providers=${providerIdsStr}`;
      console.log("[DEBUG] Added with_watch_providers:", providerIdsStr);
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
  
  
  const sortFieldMap: Record<string, string> = {
    "popularity": "popularity",
    "rating": "vote_average",
    "year": "release_date",
    "relevance": "popularity"
  };
  
  if (filters?.sortBy && sortFieldMap[filters.sortBy]) {
    const direction = filters.sortDirection || "desc"; 
    url += `&sort_by=${sortFieldMap[filters.sortBy]}.${direction}`;
  } else if (filters?.genre || filters?.platform) {
    url += "&sort_by=popularity.desc";
  }

  const response = await fetch(url, { headers: { "Cache-Control": "public, s-maxage=3600" } });

  if (!response.ok) {
    throw new Error(`TMDB error: ${response.status}`);
  }

  const data = await response.json();
    const movies = data.results?.slice(0, 20).map((movie: TmdbMovie) => ({
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

      const moviesWithProviders = await Promise.all(
         movies.map(async (movie: MovieWithProviders, index: number) => {
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

async function getTvProviders(tvId: number): Promise<{ id: number; name: string; logoUrl: string | null; type: string }[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tvId}/watch/providers?api_key=${TMDB_API_KEY}`,
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
    if (!response.ok) return [];
    
    const data = await response.json() as { results: { [country: string]: TmdbWatchProvidersByCountry } };
    const country = "ES";
    const providers = data.results?.[country];
    
    if (!providers) return [];
    
    const allProviders: ProviderWithType[] = [
      ...(providers.flatrate || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'flatrate' })),
      ...(providers.free || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'free' })),
      ...(providers.ads || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'ads' })),
      ...(providers.rent || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'rent' })),
      ...(providers.buy || []).map((p: TmdbWatchProvider): ProviderWithType => ({ ...p, type: 'buy' })),
    ];
    
    const uniqueProviders = Array.from(new Map(allProviders.map(p => [p.provider_id, p])).values());
    
    return uniqueProviders.slice(0, 5).map(p => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
      type: p.type,
    }));
  } catch {
    return [];
  }
}

async function getPopularTv(filters?: SearchFilters, page: number = 1, query?: string) {
  if (query && query.trim().length > 0) {
    console.log("[DEBUG] Using search endpoint for tv with query:", query);
    let searchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&language=es-ES&page=${page}&query=${encodeURIComponent(query)}`;
    
    if (filters?.yearFrom) {
      searchUrl += `&first_air_date_year=${filters.yearFrom}`;
    }
    
    
    const response = await fetch(searchUrl, { headers: { "Cache-Control": "public, s-maxage=3600" } });
    if (!response.ok) {
      throw new Error(`TMDB search error: ${response.status}`);
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
      providers: [], 
    })) || [];
    
    return shows;
  }

   const hasFilters = filters?.genre || filters?.yearFrom || filters?.yearTo || filters?.minRating || filters?.sortBy || (filters?.providerIds && filters.providerIds.length > 0);
   
   if (filters?.providerIds && filters.providerIds.length > 0) {
     console.log("[DEBUG] getPopularTv - providerIds:", filters.providerIds, "hasFilters:", hasFilters);
   }
  
  if (!hasFilters) {
    
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
    
     const showsWithProviders = await Promise.all(
       shows.map(async (show: TvWithProviders, index: number) => {
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
  
    
    let url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&page=${page}&language=es-ES&region=ES&watch_region=ES`;
    console.log("[DEBUG] Using discover endpoint. Filters:", JSON.stringify(filters));

    if (filters?.genre) {
     
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
     if (genreMap[filters.genre]) {
       url += `&with_genres=${genreMap[filters.genre]}`;
     }
   }
    if (filters?.providerIds && filters.providerIds.length > 0) {
      const providerIdsStr = filters.providerIds.join('|');
      url += `&with_watch_providers=${providerIdsStr}`;
      console.log("[DEBUG] Added with_watch_providers:", providerIdsStr);
    }
    if (filters?.accessType) {
      const monetizationMap: Record<string, string> = {
        subscription: "flatrate",
        free: "free",
        ads: "ads",
        rent: "rent",
        buy: "buy"
      };
      const monetizationType = monetizationMap[filters.accessType];
      if (monetizationType) {
        url += `&with_watch_monetization_types=${monetizationType}`;
        console.log("[DEBUG] Added with_watch_monetization_types:", monetizationType);
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
  
  
  const sortFieldMap: Record<string, string> = {
    "popularity": "popularity",
    "rating": "vote_average",
    "year": "first_air_date",
    "relevance": "popularity"
  };
  
  if (filters?.sortBy && sortFieldMap[filters.sortBy]) {
    const direction = filters.sortDirection || "desc"; 
    url += `&sort_by=${sortFieldMap[filters.sortBy]}.${direction}`;
  } else if (filters?.genre || filters?.platform) {
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

    const showsWithProviders = await Promise.all(
      shows.map(async (show: TvWithProviders) => {
        const tmdbId = show.id.replace("tmdb_", "");
        const providers = await getTvProviders(parseInt(tmdbId));
        return { ...show, providers };
      })
    );

  return showsWithProviders;
}

async function getPopularGames(filters?: SearchFilters, page: number = 1, query?: string) {
  const token = await getIgdbToken();

  if (query && query.trim().length > 0) {
    console.log("[DEBUG] Using IGDB search for games with query:", query);
    const searchQuery = `search "${query}";`;
    const limit = 20;
    const offset = (page - 1) * 20;
    
    const queryBody = `
      fields id, name, cover.url, first_release_date, rating, genres.name, platforms.id, platforms.name, platforms.platform_logo.image_id;
      ${searchQuery}
      limit ${limit};
      offset ${offset};
    `;
    
    const response = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": IGDB_CLIENT_ID,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
      body: queryBody.trim(),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("IGDB search error:", response.status, errorText);
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
      voteAverage: game.rating ? Math.round(game.rating) / 10 : null,
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
  }

  let queryBody = "fields id, name, cover.url, first_release_date, rating, genres.name, platforms.id, platforms.name, platforms.platform_logo.image_id;";
  
  
  const genreIdMap: Record<string, number> = {
    "Acción": 4,          
    "Aventura": 31,       
    "RPG": 12,            
    "Estrategia": 15,     
    "Deportes": 14,       
    "Carreras": 10,       
    "Puzzle": 9,          
    "Horror": 13,         
    "Supervivencia": 36,  
    "Lucha": 4,           
    "Shooter": 5,         
    "Plataformas": 8,     
    "Música": 7,          
    "Arcade": 33,         
    "Visual Novel": 34,   
    "Simulación": 13,     
  };
  
  
  
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
    "Android": [34],                   
   };

   const conditions: string[] = [];
  
  
  conditions.push("first_release_date != null");
  
  if (filters?.genre || filters?.platform) {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const fiveYearsAgoTimestamp = Math.floor(fiveYearsAgo.getTime() / 1000);
    conditions.push(`first_release_date >= ${fiveYearsAgoTimestamp}`);
    
  }
  
  
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
    queryBody += " where " + conditions.join(" & ") + ";";
  }
  
  
  const sortFieldMap: Record<string, string> = {
    "popularity": "rating",
    "rating": "rating",
    "year": "first_release_date",
    "relevance": "rating"
  };
  
  if (filters?.sortBy && sortFieldMap[filters.sortBy]) {
    const direction = filters.sortDirection || "desc"; 
    queryBody += ` sort ${sortFieldMap[filters.sortBy]} ${direction};`;
  } else if (filters?.genre || filters?.platform) {
    queryBody += " sort rating desc;";
  } else {
    
    queryBody += " sort first_release_date desc;";
  }
  
  
  const offset = (page - 1) * 20;
  if (offset > 0) {
    queryBody += ` offset ${offset};`;
  }

   queryBody += " limit 20;";
   

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
        
        platformName: p.name,
        logoUrl: p.platform_logo?.image_id 
          ? `https://images.igdb.com/igdb/image/upload/t_micro/${p.platform_logo.image_id}.png`
          : null,
      })).filter((p: { logoUrl: string | null }) => p.logoUrl) || [],
    }));
     } catch {
       return [];
     }
  }

async function getTrendingUsers() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("id, username, avatar_url")
    .eq("is_public", true)
    .limit(50);
    
  if (error || !profiles) {
    console.error("Error fetching profiles:", error);
    return [];
  }
  
  const shuffled = [...profiles].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 20).map((user: { id: string; username: string | null; avatar_url: string | null }) => ({
    id: user.id,
    type: "user" as const,
    title: user.username,
    avatarUrl: user.avatar_url,
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "all") as DiscoverType;
    const page = parseInt(searchParams.get("page") || "1");
    const query = searchParams.get("q") || undefined; 
    
    let filters: SearchFilters = {};
    const filtersStr = searchParams.get("filters");
    if (filtersStr) {
      try {
        filters = JSON.parse(filtersStr);
      } catch {}
    }

    
    if (filters.providerIds && filters.providerIds.length > 0) {
      console.log("[DEBUG] GET received filters:", JSON.stringify(filters));
    }
    if (query) {
      console.log("[DEBUG] GET received query:", query);
    }

    
    const movieFilters = (type === "all" || type === "movie") ? filters : undefined;
    const tvFilters = (type === "all" || type === "tv") ? filters : undefined;
    const gameFilters = (type === "all" || type === "game") ? filters : undefined;

    const results = await Promise.allSettled([
      type === "all" || type === "movie" ? getPopularMovies(movieFilters, page, query) : Promise.resolve([]),
      type === "all" || type === "tv" ? getPopularTv(tvFilters, page, query) : Promise.resolve([]),
      type === "all" || type === "game" ? getPopularGames(gameFilters, page, query) : Promise.resolve([]),
      type === "all" ? getTrendingUsers() : Promise.resolve([]),
    ]);

     const movies = results[0].status === "fulfilled" ? results[0].value : [];
     const tv = results[1].status === "fulfilled" ? results[1].value : [];
     const games = results[2].status === "fulfilled" ? results[2].value : [];
     const users = results[3].status === "fulfilled" ? results[3].value : [];

     return NextResponse.json({
       movies,
       tv,
       games,
       users,
       total: movies.length + tv.length + games.length + users.length,
       pagination: {
         moviesTotal: movies.length,
         tvTotal: tv.length,
         gamesTotal: games.length,
         usersTotal: users.length,
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


