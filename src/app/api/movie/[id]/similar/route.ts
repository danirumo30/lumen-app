import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import type { TmdbMovie, TmdbSearchResult } from '@/types/tmdb';

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tmdbId = id.replace(/^(movie_|tmdb_)/, '');

    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/similar?api_key=${TMDB_API_KEY}&language=es-ES&page=1`,
      {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json() as TmdbSearchResult<TmdbMovie>;

    const results = data.results?.slice(0, 20).map((movie) => ({
      id: `tmdb_${movie.id}`,
      tmdbId: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      releaseDate: movie.release_date,
      releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
      overview: movie.overview,
    })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    logger.error("Error fetching similar movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar movies" },
      { status: 500 }
    );
  }
}
