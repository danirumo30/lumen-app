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
    let allProviders = [...movieProviders, ...tvProviders];
    console.log("[watch-providers] Combined total (before dedup):", allProviders.length);

    // If no providers found for region, try US fallback
    if (allProviders.length === 0) {
      console.log("[watch-providers] No providers found for region, trying US fallback");
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
        allProviders = [...usMovie, ...usTv];
        console.log("[watch-providers] US fallback total:", allProviders.length);
      }
    }

    if (allProviders.length === 0) {
      return NextResponse.json([]);
    }

    // Deduplicate by provider_id, collecting all unique types (using Set)
    interface ProviderEntry {
      id: number;
      name: string;
      logoUrl: string | null;
      types: Set<string>;
    }

    const providerMap = new Map<number, ProviderEntry>();

    allProviders.forEach(p => {
      const id = p.provider_id;
      const name = p.provider_name;
      const logoUrl = p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : null;
      const type = p.type; // 'flatrate', 'rent', 'buy', 'ads', 'free'

      const existing = providerMap.get(id);
      if (existing) {
        if (type) existing.types.add(type);
      } else {
        providerMap.set(id, {
          id,
          name,
          logoUrl,
          types: new Set(type ? [type] : []),
        });
      }
    });

    // Custom priority order for Spain (ES)
    const spainProviderOrder = [
      'Netflix',
      'Amazon Prime Video',
      'Disney Plus',
      'Movistar Plus+',
      'HBO Max',
      'SkyShowtime',
      'Apple TV',
      'Crunchyroll',
      'Atres Player',
      'RTVE Play',
      'DAZN',
      'YouTube Premium',
      'Google Play Movies',
      'Pluto TV',
      'Filmin',
      'Rakuten TV',
      'FlixOlé',
      'Plex',
      'MUBI',
      'HBO Max Amazon Channel',
      'Crunchyroll Amazon Channel',
      'AMC+ Amazon Channel',
      'FlixOlé Amazon Channel',
      'Pash Amazon Channel',
      'Planet Horror Amazon Channel',
      'Dizi Amazon Channel',
      'Acontra Plus Amazon Channel',
      'MGM Plus Amazon Channel',
      'OUTtv Amazon Channel',
      'Historia y Actualidad Amazon Channel',
      'Hayu Amazon Channel',
      'Love Nature Amazon Channel',
      'Shadowz Amazon Channel',
      'Lionsgate+ Amazon Channels',
      'AMC Channels Amazon Channel',
      'AcornTV Amazon Channel',
      'MUBI Amazon Channel',
      'AMC Plus Apple TV Channel ',
      'Apple TV Store',
      'Movistar Plus+ Ficción Total ',
      'fuboTV',
      'rtve',
      'Filmin Plus',
      'JustWatch TV',
      'Hayu',
      'Amazon Video',
      'Arte',
      'Acontra Plus',
      'Sun Nxt',
      'Curiosity Stream',
      'Tivify',
      'GuideDoc',
      '3Cat',
      'Dekkoo',
      'AGalega',
      'Rakuten Viki',
      'DOCSVILLE',
      'WOW Presents Plus',
      'Magellan TV',
      'BroadwayHD',
      'Kocowa',
      'Bloodstream',
      'MovieMe',
      'KableOne',
      'CaixaForum+',
      'Artiflix',
      'Artify'
    ];

    // Convert to array and sort by custom priority: first providers in the list (in order), then alphabetically
    const sortedProviders = Array.from(providerMap.values()).sort((a, b) => {
      const aIndex = spainProviderOrder.indexOf(a.name);
      const bIndex = spainProviderOrder.indexOf(b.name);
      
      if (aIndex !== -1 && bIndex !== -1) {
        // Both in list: sort by list order
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        // Only a in list: a comes first
        return -1;
      } else if (bIndex !== -1) {
        // Only b in list: b comes first
        return 1;
      } else {
        // Neither in list: alphabetical
        return a.name.localeCompare(b.name);
      }
    });

    const result = sortedProviders.map(p => ({
      id: p.id,
      name: p.name,
      logoUrl: p.logoUrl,
      types: Array.from(p.types), // Convert Set<string> to string[]
    }));

    console.log("[watch-providers] Sorted providers for ES (custom priority):", result.map(p => p.name));
    console.log("[watch-providers] Providers with types:", result.map(p => ({name: p.name, types: p.types})));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching watch providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch watch providers" },
      { status: 500 }
    );
  }
}
