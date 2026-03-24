import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const runtime = "nodejs";

// Get streaming providers for a TV show
async function getTvProviders(tvId: number): Promise<{ id: number; name: string; logoUrl: string }[]> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${tvId}/watch/providers?api_key=${TMDB_API_KEY}`,
      { headers: { "Cache-Control": "public, s-maxage=86400" } }
    );
    if (!response.ok) return [];
    
    const data = await response.json();
    const country = "ES";
    const providers = data.results?.[country];
    
    if (!providers) return [];
    
    const allProviders = [
      ...(providers.flatrate || []),
      ...(providers.free || []),
      ...(providers.ads || []),
    ];
    
    return allProviders.slice(0, 5).map((p: any) => ({
      id: p.provider_id,
      name: p.provider_name,
      logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
    })).filter((p: { logoUrl: string | null }): p is { id: number; name: string; logoUrl: string } => Boolean(p.logoUrl));
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

    const data = await response.json();

    const shows = data.results?.slice(0, 20).map((tv: {
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
      overview: tv.overview,
    })) || [];

    // Fetch providers for first 10 TV shows
    const showsWithProviders = await Promise.all(
      shows.slice(0, 10).map(async (show: any, index: number) => {
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
    console.error("Error fetching trending TV shows:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending TV shows" },
      { status: 500 }
    );
  }
}
