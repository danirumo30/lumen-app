import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import type { TmdbMovie, TmdbSearchResult } from '@/types/tmdb';

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const runtime = "nodejs";

interface ProviderResult {
  id: number;
  name: string;
  logoUrl: string;
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
}

interface TmdbWatchProvidersData {
  id: number;
  results: {
    [countryCode: string]: TmdbProvidersByCountry;
  };
  link?: string;
}

interface MovieResult {
  id: string;
  title: string;
  posterUrl: string | null;
  voteAverage: number;
  releaseDate: string;
  overview: string;
  providers?: ProviderResult[];
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
    
    return allProviders.slice(0, 5).map((p) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
    })).filter((p): p is ProviderResult => Boolean(p.logoUrl));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=es-ES`,
      { 
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json() as TmdbSearchResult<TmdbMovie>;
    
    const movies = data.results?.slice(0, 20).map((movie) => ({
      id: `tmdb_${movie.id}`,
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

    return NextResponse.json({ results: moviesWithProviders });
  } catch (error) {
    logger.error("Error fetching trending movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending movies" },
      { status: 500 }
    );
  }
}

