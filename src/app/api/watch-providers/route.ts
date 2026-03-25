import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: Request) {
  try {
    // Get region from query param, default to ES
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'ES';
    
    console.log("[watch-providers] Fetching for region:", region);

    // Get all watch providers from TMDB for BOTH movie and tv
    const [movieResponse, tvResponse] = await Promise.all([
      fetch(
        `${TMDB_BASE_URL}/watch/providers/movie?api_key=${TMDB_API_KEY}&language=es-ES&watch_region=${region}`,
        { headers: { "Cache-Control": "public, s-maxage=86400" } }
      ),
      fetch(
        `${TMDB_BASE_URL}/watch/providers/tv?api_key=${TMDB_API_KEY}&language=es-ES&watch_region=${region}`,
        { headers: { "Cache-Control": "public, s-maxage=86400" } }
      )
    ]);

    if (!movieResponse.ok || !tvResponse.ok) {
      throw new Error(`TMDB API error: movie=${movieResponse.status}, tv=${tvResponse.status}`);
    }

    const movieData = await movieResponse.json();
    const tvData = await tvResponse.json();
    
    console.log("[watch-providers] Movie data type:", typeof movieData, "has results:", movieData?.results);
    console.log("[watch-providers] TV data type:", typeof tvData, "has results:", tvData?.results);
    
    // Extract arrays from results property (TMDB returns { results: [...] })
    const movieProviders = Array.isArray(movieData?.results) ? movieData.results : [];
    const tvProviders = Array.isArray(tvData?.results) ? tvData.results : [];
    
    console.log("[watch-providers] Movie providers count:", movieProviders.length);
    console.log("[watch-providers] TV providers count:", tvProviders.length);
    
    // Combine both arrays (they are already filtered by region)
    const allProviders = [...movieProviders, ...tvProviders];
    console.log("[watch-providers] Combined total (before dedup):", allProviders.length);

    if (allProviders.length === 0) {
      console.log("[watch-providers] No providers found for region, trying US fallback");
      // Try US as fallback
      const usResponse = await fetch(
        `${TMDB_BASE_URL}/watch/providers/movie?api_key=${TMDB_API_KEY}&language=es-ES&watch_region=US`,
        { headers: { "Cache-Control": "public, s-maxage=86400" } }
      );
      const usTvResponse = await fetch(
        `${TMDB_BASE_URL}/watch/providers/tv?api_key=${TMDB_API_KEY}&language=es-ES&watch_region=US`,
        { headers: { "Cache-Control": "public, s-maxage=86400" } }
      );
      
      if (usResponse.ok && usTvResponse.ok) {
        const usMovie = await usResponse.json();
        const usTv = await usTvResponse.json();
        const usProviders = [...usMovie, ...usTv];
        console.log("[watch-providers] US fallback total:", usProviders.length);
        
        if (usProviders.length === 0) {
          return NextResponse.json([]);
        }
        
        // Deduplicate US providers
        const providerMap = new Map<number, { id: number; name: string; logoUrl: string | null; types: string[] }>();
        usProviders.forEach(p => {
          const existing = providerMap.get(p.provider_id);
          if (existing) {
            if (!existing.types.includes(p.type)) {
              existing.types.push(p.type);
            }
          } else {
            providerMap.set(p.provider_id, {
              id: p.provider_id,
              name: p.provider_name,
              logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
              types: [p.type],
            });
          }
        });
        
        const result = Array.from(providerMap.values()).map(p => ({
          id: p.id,
          name: p.name,
          logoUrl: p.logoUrl,
          types: p.types as ("subscription" | "free" | "ads" | "rent" | "buy")[],
        }));
        
        return NextResponse.json(result);
      }
    }

    // Deduplicate by provider_id, collecting all types and keeping lowest display_priority
    interface ProviderWithPriority {
      id: number;
      name: string;
      logoUrl: string | null;
      types: string[];
      displayPriority: number;
    }

    const providerMap = new Map<number, ProviderWithPriority>();

    allProviders.forEach(p => {
      const existing = providerMap.get(p.provider_id);
      if (existing) {
        if (!existing.types.includes(p.type)) {
          existing.types.push(p.type);
        }
        // Keep the lowest display_priority (most important)
        if (p.display_priority !== undefined && p.display_priority < existing.displayPriority) {
          existing.displayPriority = p.display_priority;
        }
      } else {
        providerMap.set(p.provider_id, {
          id: p.provider_id,
          name: p.provider_name,
          logoUrl: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null,
          types: [p.type],
          displayPriority: p.display_priority ?? 999, // Default high priority for missing values
        });
      }
    });

    // Convert to array, sort by display_priority ascending (0, 1, 2, ...)
    const sortedProviders: ProviderWithPriority[] = Array.from(providerMap.values())
      .sort((a, b) => a.displayPriority - b.displayPriority);

    const result = sortedProviders.map(p => ({
      id: p.id,
      name: p.name,
      logoUrl: p.logoUrl,
      types: p.types as ("subscription" | "free" | "ads" | "rent" | "buy")[],
    }));

    console.log("[watch-providers] Final sorted providers (by display_priority):", sortedProviders.map(p => ({ name: p.name, priority: p.displayPriority })));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching watch providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch watch providers" },
      { status: 500 }
    );
  }
}
