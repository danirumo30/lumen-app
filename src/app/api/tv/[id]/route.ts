import { logger } from '@/shared/logger';
import { NextResponse } from "next/server";
import type { TmdbTv, TmdbWatchProvidersByCountry, TmdbWatchProvider } from '@/types/tmdb';


interface TvContentRating {
  iso_3166_1: string;
  rating: string;
}

interface TvContentRatings {
  results: TvContentRating[];
}

interface TvSeason {
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview?: string;
}

interface TvCreditsPerson {
  id: number;
  name: string;
  profile_path: string | null;
  character?: string;
  character_name?: string;
  order?: number;
  roles?: Array<{ character?: string; character_name?: string }>;
}

interface TvAggregateCredits {
  cast: TvCreditsPerson[];
  crew: TvCreditsPerson[];
}

interface TvNetwork {
  id: number;
  name: string;
  logo_path?: string | null;
}

interface TvGenre {
  id: number;
  name: string;
}

interface TvCreatedBy {
  id: number;
  name: string;
  profile_path: string | null;
}


interface TvDetail extends TmdbTv {
  content_ratings?: TvContentRatings;
  aggregate_credits?: TvAggregateCredits;
  seasons?: TvSeason[];
  genres?: TvGenre[];
  networks?: TvNetwork[];
  created_by?: TvCreatedBy[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  in_production?: boolean;
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
    
    const tmdbId = id.replace(/^(tv_|tmdb_)/, '');

    const url = new URL(request.url);
    const country = url.searchParams.get("country") || "ES";

    const [tvResponse, watchProvidersResponse] = await Promise.all([
      fetch(
        `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=content_ratings,aggregate_credits`,
        {
          headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
        }
      ),
      fetch(
        `${TMDB_BASE_URL}/tv/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`,
        {
          headers: { "Cache-Control": "public, s-maxage=86400" }
        }
      ),
    ]);

    if (!tvResponse.ok) {
      throw new Error(`TMDB API error: ${tvResponse.status}`);
    }

     const tv = await tvResponse.json() as TvDetail;

    let certification: string | null = null;
    if (tv.content_ratings?.results) {
      const usRating = tv.content_ratings.results.find((r) => r.iso_3166_1 === "US");
      if (usRating?.rating) {
        certification = usRating.rating;
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

    const seasons: Array<{
      seasonNumber: number;
      name: string;
      episodeCount: number;
      airDate: string | null;
      overview?: string;
      posterPath: string | null;
    }> = tv.seasons?.map((season: TvSeason) => ({
      seasonNumber: season.season_number,
      name: season.name,
      episodeCount: season.episode_count,
      airDate: season.air_date,
      overview: season.overview,
      posterPath: season.poster_path
        ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
        : null,
    })) || [];

    const cast: Array<{
      id: number;
      name: string;
      character: string;
      profileUrl: string | null;
      order: number;
    }> = tv.aggregate_credits?.cast?.slice(0, 20).map((person: TvCreditsPerson) => ({
      id: person.id,
      name: person.name,
      character: person.roles?.[0]?.character || person.roles?.[0]?.character_name || "",
      profileUrl: person.profile_path
        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
        : null,
      order: person.order ?? 0,
    })) || [];

    const result = {
      id: `tmdb_${tv.id}`,
      tmdbId: tv.id,
      title: tv.name,
      originalTitle: tv.original_name,
      overview: tv.overview,
      posterUrl: tv.poster_path
        ? `https://image.tmdb.org/t/p/w500${tv.poster_path}`
        : null,
      backdropUrl: tv.backdrop_path
        ? `https://image.tmdb.org/t/p/original${tv.backdrop_path}`
        : null,
      firstAirDate: tv.first_air_date,
      lastAirDate: tv.last_air_date,
      releaseYear: tv.first_air_date ? new Date(tv.first_air_date).getFullYear() : null,
      genres: tv.genres?.map((g: TvGenre) => ({ id: g.id, name: g.name })) || [],
      rating: tv.vote_average ? Math.round(tv.vote_average * 10) / 10 : null,
      voteCount: tv.vote_count,
      certification,
      status: tv.status,
      tagline: tv.tagline,
      numberOfSeasons: tv.number_of_seasons,
      numberOfEpisodes: tv.number_of_episodes,
      seasons,
      cast,
      inProduction: tv.in_production,
      networks: tv.networks?.map((n: TvNetwork) => ({ 
        id: n.id, 
        name: n.name, 
        logoPath: n.logo_path ? `https://image.tmdb.org/t/p/w500${n.logo_path}` : null 
      })) || [],
      createdBy: tv.created_by?.map((c: TvCreatedBy) => ({ 
        id: c.id, 
        name: c.name, 
        profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null 
      })) || [],
      watchProviders: formattedWatchProviders,
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching TV show details:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV show details" },
      { status: 500 }
    );
  }
}

