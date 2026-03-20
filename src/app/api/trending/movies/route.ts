import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const runtime = "edge";

export async function GET() {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=es-ES`,
      { next: { revalidate: 3600 } } // Cache 1 hour
    );

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }

    const data = await response.json();

    const results = data.results?.slice(0, 20).map((movie: {
      id: number;
      title: string;
      poster_path: string | null;
      vote_average: number;
      release_date: string;
      overview: string;
    }) => ({
      id: `tmdb_${movie.id}`,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
      voteAverage: Math.round(movie.vote_average * 10) / 10,
      releaseDate: movie.release_date,
      overview: movie.overview,
    })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending movies" },
      { status: 500 }
    );
  }
}
