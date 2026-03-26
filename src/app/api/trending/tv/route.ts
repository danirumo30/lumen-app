import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import type { TmdbTv, TmdbSearchResult } from '@/types/tmdb';

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

interface TvResult {
  id: string;
  title: string;
  posterUrl: string | null;
  voteAverage: number;
  firstAirDate: string;
  overview: string;
  providers?: ProviderResult[];
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
      `${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&language=es-ES`,
      { 
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json() as TmdbSearchResult<TmdbTv>;

    const shows = data.results?.slice(0, 20).map((tv) => ({
      id: `tmdb_${tv.id}`,
      title: tv.name,
      posterUrl: tv.poster_path
        ? `https://image.tmdb.org/t/p/w500${tv.poster_path}`
        : null,
      voteAverage: Math.round(tv.vote_average * 10) / 10,
      firstAirDate: tv.first_air_date || "",
      overview: tv.overview || "",
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

    return NextResponse.json({ results: showsWithProviders });
  } catch (error) {
    logger.error("Error fetching trending TV shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending TV shows" },
      { status: 500 }
    );
  }
}

