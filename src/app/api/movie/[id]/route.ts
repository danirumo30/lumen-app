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
    // Remove 'movie_' or 'tmdb_' prefix if present
    const tmdbId = id.replace(/^(movie_|tmdb_)/, '');

    // Get country from query param or default to ES
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

    const movie = await movieResponse.json();

    // Get certification from release_dates
    let certification = null;
    if (movie.release_dates?.results) {
      const usRelease = movie.release_dates.results.find((r: any) => r.iso_3166_1 === "US");
      if (usRelease?.release_dates?.[0]?.certification) {
        certification = usRelease.release_dates[0].certification;
      }
    }

    // Get watch providers for the specified country
    let watchProviders: any = null;
    if (watchProvidersResponse.ok) {
      const providersData = await watchProvidersResponse.json();
      watchProviders = providersData.results?.[country] || null;
    }

    // Transform watch providers to a cleaner format
    const formattedWatchProviders = watchProviders ? {
      link: watchProviders.link,
      providers: [
        ...(watchProviders.flatrate || []).map((p: any) => ({ ...p, type: "subscription" })),
        ...(watchProviders.free || []).map((p: any) => ({ ...p, type: "free" })),
        ...(watchProviders.ads || []).map((p: any) => ({ ...p, type: "ads" })),
        ...(watchProviders.rent || []).map((p: any) => ({ ...p, type: "rent" })),
        ...(watchProviders.buy || []).map((p: any) => ({ ...p, type: "buy" })),
      ].map((p: any) => ({
        id: p.provider_id,
        name: p.provider_name,
        logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
        type: p.type,
      })),
    } : null;

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
      watchProviders: formattedWatchProviders,
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
