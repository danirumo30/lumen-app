import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const tmdbId = id.replace(/^(tv_|tmdb_)/, '');

    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}/similar?api_key=${TMDB_API_KEY}&language=es-ES&page=1`,
      { 
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    const results = data.results?.slice(0, 20).map((tv: {
      id: number;
      name: string;
      poster_path: string | null;
      vote_average: number;
      first_air_date: string;
      overview: string;
    }) => ({
      id: `tmdb_${tv.id}`,
      title: tv.name,
      posterUrl: tv.poster_path
        ? `https://image.tmdb.org/t/p/w500${tv.poster_path}`
        : null,
      voteAverage: Math.round(tv.vote_average * 10) / 10,
      firstAirDate: tv.first_air_date,
      releaseYear: tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : null,
      overview: tv.overview,
    })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    logger.error("Error fetching similar TV shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar TV shows" },
      { status: 500 }
    );
  }
}
