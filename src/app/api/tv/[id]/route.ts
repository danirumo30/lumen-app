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
    // Remove 'tv_' or 'tmdb_' prefix if present
    const tmdbId = id.replace(/^(tv_|tmdb_)/, '');

    // Get country from query param or default to ES
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

    const tv = await tvResponse.json();

    // Get certification from content_ratings
    let certification = null;
    if (tv.content_ratings?.results) {
      const usRating = tv.content_ratings.results.find((r: any) => r.iso_3166_1 === "US");
      if (usRating?.rating) {
        certification = usRating.rating;
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

    // Get seasons overview (without episodes to reduce payload)
    const seasons = tv.seasons?.map((season: any) => ({
      seasonNumber: season.season_number,
      name: season.name,
      episodeCount: season.episode_count,
      airDate: season.air_date,
      overview: season.overview,
      posterPath: season.poster_path
        ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
        : null,
    })) || [];

    // Get top cast (first 20)
    const cast = tv.aggregate_credits?.cast?.slice(0, 20).map((person: any) => ({
      id: person.id,
      name: person.name,
      character: person.roles?.[0]?.character || person.roles?.[0]?.character_name || "",
      profileUrl: person.profile_path
        ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
        : null,
      order: person.order,
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
      genres: tv.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
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
      networks: tv.networks?.map((n: any) => ({ id: n.id, name: n.name, logoPath: n.logo_path ? `https://image.tmdb.org/t/p/w500${n.logo_path}` : null })) || [],
      createdBy: tv.created_by?.map((c: any) => ({ id: c.id, name: c.name, profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null })) || [],
      watchProviders: formattedWatchProviders,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching TV show details:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV show details" },
      { status: 500 }
    );
  }
}
