import { logger } from '@/shared/logger';
import { NextResponse } from "next/server";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";


interface IgdbGameDetail {
  id: number;
  name: string;
  category: number;
  platforms?: number[];
  version_parent?: number | null;
}

interface IgdbPlatform {
  id: number;
  abbreviation?: string;
  name?: string;
}

interface GameDetailResult {
  id: string;
  name: string;
  type: "main" | "dlc" | "expansion" | "edition";
  platforms: string[];
}

interface FranchiseDetailsResponse {
  details: GameDetailResult[];
}

const franchiseDetailsCache = new Map<string, { data: FranchiseDetailsResponse; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; 

async function getFreshAccessToken(): Promise<string> {
  const tokenResponse = await fetch(
    "https://id.twitch.tv/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: IGDB_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET || "",
        grant_type: "client_credentials",
      }),
    }
  );

  if (!tokenResponse.ok) {
    throw new Error(`Failed to get IGDB token: ${tokenResponse.status}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function fetchWithTokenRefresh(
  url: string,
  body: string,
  token: string,
  retry = false
): Promise<Response> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (response.status === 401 && !retry) {
    const newToken = await getFreshAccessToken();
    process.env.IGDB_ACCESS_TOKEN = newToken;
    return fetchWithTokenRefresh(url, body, newToken, true);
  }

  return response;
}

function mapCategoryToType(category: number): "main" | "dlc" | "expansion" | "edition" {
  switch (category) {
    case 0:
      return "main"; 
    case 4:
      return "expansion"; 
    case 6:
      return "edition"; 
    case 7:
      return "edition"; 
    case 8:
      return "edition"; 
    default:
      
      return "dlc";
  }
}


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const igdbId = parseInt(id.replace(/^igdb_/, ''));

    if (isNaN(igdbId)) {
      return NextResponse.json({ error: "Invalid IGDB ID" }, { status: 400 });
    }

    const cacheKey = `franchise_details_${igdbId}`;
    const cached = franchiseDetailsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    
    const gameRes = await fetchWithTokenRefresh(
      "https://api.igdb.com/v4/games",
      `fields id, name, collections, franchises; where id = ${igdbId}; limit 1;`,
      IGDB_ACCESS_TOKEN
    );

    if (!gameRes.ok) {
      throw new Error(`IGDB API error: ${gameRes.status}`);
    }

    const games = await gameRes.json();
    
    if (!games || games.length === 0) {
      return NextResponse.json({ details: [] });
    }

    const game = games[0];
    const collectionIds = game.collections || [];
    const franchiseIds = game.franchises || [];

    let gameIds: number[] = [];

    if (collectionIds.length > 0) {
      const collectionId = collectionIds[0];
      
      const collectionGamesRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/games",
        `fields id, name, category, platforms; where collections = ${collectionId} & version_title = null; limit 50;`,
        IGDB_ACCESS_TOKEN
      );

       if (collectionGamesRes.ok) {
         const collectionGames = await collectionGamesRes.json() as IgdbGameDetail[];
         gameIds = collectionGames
           .filter((g) => !g.version_parent)
           .map((g) => g.id);
       }
    }

    if (gameIds.length === 0 && franchiseIds.length > 0) {
      const franchiseId = franchiseIds[0];
      
      const franchiseGamesRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/games",
        `fields id, name, category, platforms; where franchises = ${franchiseId} & version_title = null; limit 50;`,
        IGDB_ACCESS_TOKEN
      );

       if (franchiseGamesRes.ok) {
         const franchiseGames = await franchiseGamesRes.json() as IgdbGameDetail[];
         gameIds = franchiseGames
           .filter((g) => !g.version_parent)
           .map((g) => g.id);
       }
    }

    if (gameIds.length === 0) {
      return NextResponse.json({ details: [] });
    }

    
    
    const idsString = gameIds.join(",");
    const detailsRes = await fetchWithTokenRefresh(
      "https://api.igdb.com/v4/games",
      `fields id, name, category, platforms, version_parent; where id = (${idsString}); limit ${gameIds.length};`,
      IGDB_ACCESS_TOKEN
    );

    if (!detailsRes.ok) {
      throw new Error(`IGDB API error: ${detailsRes.status}`);
    }

     const detailsGames = await detailsRes.json() as IgdbGameDetail[];

     const allPlatformIds = new Set<number>();
     detailsGames.forEach((g) => {
       g.platforms?.forEach((p) => allPlatformIds.add(p));
     });

     const platformNamesMap: Record<number, string> = {};
     if (allPlatformIds.size > 0) {
       const platformIdsString = Array.from(allPlatformIds).join(",");
       const platformsRes = await fetchWithTokenRefresh(
         "https://api.igdb.com/v4/platforms",
         `fields id, name, abbreviation; where id = (${platformIdsString}); limit ${allPlatformIds.size};`,
         IGDB_ACCESS_TOKEN
       );

       if (platformsRes.ok) {
         const platforms = await platformsRes.json() as IgdbPlatform[];
         platforms.forEach((p) => {
           platformNamesMap[p.id] = p.abbreviation || p.name || `Platform ${p.id}`;
         });
       }
     }

     const details = detailsGames
       .filter((g) => !g.version_parent) 
       .map((g) => {
         const type = mapCategoryToType(g.category || 0);
         const platformNames = (g.platforms || []).map((p) => 
           platformNamesMap[p] || `Platform ${p}`
         );

         return {
           id: `igdb_${g.id}`,
           name: g.name,
           type,
           platforms: platformNames,
         };
       });

    const result = { details };
    franchiseDetailsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching franchise details:", error);
    return NextResponse.json(
      { error: "Failed to fetch franchise details", details: [] },
      { status: 500 }
    );
  }
}

