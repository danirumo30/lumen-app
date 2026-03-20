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
    const tmdbId = id.replace('tmdb_', '');

    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=es-ES`,
      { 
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    // Get top 20 cast members
    const cast = data.cast?.slice(0, 20).map((person: any) => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profileUrl: person.profile_path
        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
        : null,
      order: person.order,
    })) || [];

    // Get directors and writers
    const crew = data.crew || [];
    const directors = crew
      .filter((c: any) => c.job === "Director")
      .map((c: any) => ({ id: c.id, name: c.name }));
    
    const writers = crew
      .filter((c: any) => ["Screenplay", "Writer", "Story"].includes(c.job))
      .map((c: any) => ({ id: c.id, name: c.name, job: c.job }));

    return NextResponse.json({ cast, directors, writers });
  } catch (error) {
    console.error("Error fetching movie credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie credits" },
      { status: 500 }
    );
  }
}
