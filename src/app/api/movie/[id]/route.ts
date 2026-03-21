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
    // Remove 'tmdb_' prefix if present
    const tmdbId = id.replace('tmdb_', '');

    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES&append_to_response=release_dates`,
      { 
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }
      }
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const movie = await response.json();

    // Get certification from release_dates
    let certification = null;
    if (movie.release_dates?.results) {
      const usRelease = movie.release_dates.results.find((r: any) => r.iso_3166_1 === "US");
      if (usRelease?.release_dates?.[0]?.certification) {
        certification = usRelease.release_dates[0].certification;
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
      genres: movie.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
      rating: movie.vote_average ? Math.round(movie.vote_average * 10) / 10 : null,
      voteCount: movie.vote_count,
      certification,
      status: movie.status,
      tagline: movie.tagline,
      homepage: movie.homepage,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie details" },
      { status: 500 }
    );
  }
}
