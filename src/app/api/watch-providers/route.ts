import { logger } from '@/shared/logger';
import { NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'ES';
    

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
    
    
    
    const movieProviders = Array.isArray(movieData?.results) ? movieData.results : [];
    const tvProviders = Array.isArray(tvData?.results) ? tvData.results : [];
    
    
    
    let allProviders = [...movieProviders, ...tvProviders];

    if (allProviders.length === 0) {
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
      }
    }

    if (allProviders.length === 0) {
      return NextResponse.json([]);
    }

    
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
      
      const types = new Set<string>();
      if (p.flatrate && p.flatrate.length > 0) types.add('flatrate');
      if (p.free && p.free.length > 0) types.add('free');
      if (p.ads && p.ads.length > 0) types.add('ads');
      if (p.rent && p.rent.length > 0) types.add('rent');
      if (p.buy && p.buy.length > 0) types.add('buy');

      const existing = providerMap.get(id);
      if (existing) {
        
        types.forEach(t => existing.types.add(t));
      } else {
        providerMap.set(id, {
          id,
          name,
          logoUrl,
          types,
        });
      }
    });

    
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

    const sortedProviders = Array.from(providerMap.values()).sort((a, b) => {
      const aIndex = spainProviderOrder.indexOf(a.name);
      const bIndex = spainProviderOrder.indexOf(b.name);
      
      if (aIndex !== -1 && bIndex !== -1) {
        
        return aIndex - bIndex;
      } else if (aIndex !== -1) {
        
        return -1;
      } else if (bIndex !== -1) {
        
        return 1;
      } else {
        
        return a.name.localeCompare(b.name);
      }
    });

    const result = sortedProviders.map(p => ({
      id: p.id,
      name: p.name,
      logoUrl: p.logoUrl,
      types: Array.from(p.types), 
    }));

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching watch providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch watch providers" },
      { status: 500 }
    );
  }
}







