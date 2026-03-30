import { logger } from '@/shared/logger';
import { NextResponse } from "next/server";
import type { TmdbPerson } from '@/types/tmdb';

interface CastMember extends TmdbPerson {
  character: string;
  order: number;
}

interface CrewMember extends TmdbPerson {
  job: string;
  department: string;
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
    const tmdbId = id.replace(/^(movie_|tmdb_)/, '');

    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=es-ES`,
      {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json() as {
      cast: CastMember[];
      crew: CrewMember[];
    };

    const cast = data.cast?.slice(0, 20).map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profileUrl: person.profile_path
        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
        : null,
      order: person.order,
    })) || [];

    const crew = data.crew || [];
    const directors = crew
      .filter((c) => c.job === "Director")
      .map((c) => ({ id: c.id, name: c.name }));

    const writers = crew
      .filter((c) => ["Screenplay", "Writer", "Story"].includes(c.job))
      .map((c) => ({ id: c.id, name: c.name, job: c.job }));

    return NextResponse.json({ cast, directors, writers });
  } catch (error) {
    logger.error("Error fetching movie credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie credits" },
      { status: 500 }
    );
  }
}

