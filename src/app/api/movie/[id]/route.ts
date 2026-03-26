import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import type { TmdbMovie, TmdbWatchProvidersByCountry, TmdbWatchProvider, TmdbGenre } from '@/types/tmdb';

// Local interfaces for movie detail response
interface MovieReleaseDateEntry {
  iso_3166_1: string;
  release_dates: Array<{ certification: string }>;
}

interface MovieReleaseDates {
  results: MovieReleaseDateEntry[];
}

interface MovieDetail extends TmdbMovie {
  runtime?: number;
  genres?: TmdbGenre[];
  homepage?: string;
  release_dates?: MovieReleaseDates;
}

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Remove 'movie_' or 'tmdb_' prefix if present
    const tmdbId = id.replace(/^(movie_|tmdb_)/, '');

    const url = new URL(request.url);
    const country = url.searchParams.get("country") || "ES";

    const [movieResponse, watchProvidersResponse] = await Promise.all([
      fetch(
        `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=release_dates`,
        {
          headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
        }
      ),
      fetch(
        `${TMDB_BASE_URL}/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`,
        {
          headers: { "Cache-Control": "public, s-maxage=86400" }
        }
      ),
    ]);

    if (!movieResponse.ok) {
      throw new Error(`TMDB API error: ${movieResponse.status}`);
    }

     const movie = await movieResponse.json() as MovieDetail;

    let certification: string | null = null;
    if (movie.release_dates?.results) {
      const usRelease = movie.release_dates.results.find((r) => r.iso_3166_1 === "US");
      if (usRelease?.release_dates?.[0]?.certification) {
        certification = usRelease.release_dates[0].certification;
      }
    }

    let formattedWatchProviders: { link?: string; providers: Array<{ id: number; name: string; logoUrl: string | null; type: string }> } | null = null;
    if (watchProvidersResponse.ok) {
      const providersData = await watchProvidersResponse.json() as { link?: string; results: { [country: string]: TmdbWatchProvidersByCountry } };
      const providersForCountry = providersData.results?.[country] ?? null;
      if (providersForCountry) {
        formattedWatchProviders = {
          link: providersData.link,
          providers: [
            ...(providersForCountry.flatrate ?? []).map((p: TmdbWatchProvider) => ({ ...p, type: "subscription" })),
            ...(providersForCountry.free ?? []).map((p: TmdbWatchProvider) => ({ ...p, type: "free" })),
            ...(providersForCountry.ads ?? []).map((p: TmdbWatchProvider) => ({ ...p, type: "ads" })),
            ...(providersForCountry.rent ?? []).map((p: TmdbWatchProvider) => ({ ...p, type: "rent" })),
            ...(providersForCountry.buy ?? []).map((p: TmdbWatchProvider) => ({ ...p, type: "buy" })),
          ].map((p) => ({
            id: p.provider_id,
            name: p.provider_name,
            logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
            type: p.type,
          })),
        };
      }
    }

    const result = {
      id: `tmdb_${movie.id}`,
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      backdropUrl: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : null,
      releaseDate: movie.release_date,
      releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      runtime: movie.runtime,
      genres: movie.genres?.map((g: TmdbGenre) => ({ id: g.id, name: g.name })) || [],
      rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
      voteCount: movie.vote_count,
      certification,
      status: movie.status,
      tagline: movie.tagline,
      homepage: movie.homepage,
      watchProviders: formattedWatchProviders,
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching movie details:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie details" },
      { status: 500 }
    );
  }
}

