import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; season: string }> }
) {
  try {
    const { id, season } = await params;
    // Remove 'tv_' or 'tmdb_' prefix if present
    const tmdbId = id.replace(/^(tv_|tmdb_)/, '');

    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tmdbId}/season/${season}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=credits`,
      { 
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const seasonData = await response.json();

    const result = {
      id: seasonData.id,
      seasonNumber: seasonData.season_number,
      name: seasonData.name,
      airDate: seasonData.air_date,
      overview: seasonData.overview,
      posterPath: seasonData.poster_path
        ? `https://image.tmdb.org/t/p/w500${seasonData.poster_path}`
        : null,
      episodes: seasonData.episodes?.map((episode: any) => ({
        id: episode.id,
        episodeNumber: episode.episode_number,
        seasonNumber: episode.season_number,
        name: episode.name,
        airDate: episode.air_date,
        overview: episode.overview,
        runtime: episode.runtime,
        stillPath: episode.still_path
          ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
          : null,
        voteAverage: episode.vote_average ? Math.round(episode.vote_average * 10) / 10 : null,
        voteCount: episode.vote_count,
        crew: episode.crew?.slice(0, 5).map((person: any) => ({
          id: person.id,
          name: person.name,
          job: person.job,
          profilePath: person.profile_path
            ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
            : null,
        })) || [],
        guestStars: episode.guest_stars?.slice(0, 5).map((person: any) => ({
          id: person.id,
          name: person.name,
          character: person.character,
          profilePath: person.profile_path
            ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
            : null,
        })) || [],
      })) || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching TV season details:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV season details" },
      { status: 500 }
    );
  }
}
