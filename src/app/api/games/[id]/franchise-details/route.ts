import { NextResponse } from "next/server";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";

// Cache for franchise details
const franchiseDetailsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

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

// Map IGDB category to human-readable type
function mapCategoryToType(category: number): "main" | "dlc" | "expansion" | "edition" {
  switch (category) {
    case 0:
      return "main"; // main_game
    case 4:
      return "expansion"; // expansion
    case 6:
      return "edition"; // edition
    case 7:
      return "edition"; // remake
    case 8:
      return "edition"; // port
    default:
      // Bundles and others could be treated as DLC
      return "dlc";
  }
}

// Platform names mapping for common platforms
const platformNames: Record<number, string[]> = {
  6: ["PC", "Windows"], // PC (Windows)
  48: ["PC", "PlayStation"], // PlayStation
  49: ["PC", "Xbox"], // Xbox
  130: ["Nintendo", "Switch"], // Nintendo Switch
  167: ["PlayStation 5"], // PlayStation 5
  169: ["Xbox Series"], // Xbox Series X/S
  170: ["Nintendo", "Switch"], // Nintendo Switch
  11: ["PC", "PlayStation"], // PlayStation 3
  12: ["PC", "Xbox"], // Xbox 360
  37: ["Nintendo", "3DS"],
  38: ["Nintendo", "DS"],
  39: ["Nintendo", "Wii"],
  41: ["Nintendo", "Wii U"],
  64: ["PC", "Linux"],
  65: ["PC", "macOS"],
  74: ["PC", "PlayStation"], // PlayStation 4
  76: ["PC", "Xbox"], // Xbox One
};

// Normalize platform to our filter categories
function mapPlatformToFilterCategory(platformId: number): string[] {
  const mapped = platformNames[platformId] || [];
  return mapped;
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

    // Check cache
    const cacheKey = `franchise_details_${igdbId}`;
    const cached = franchiseDetailsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Step 1: Get the game to find its collections and franchises
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

    // Try collections first
    if (collectionIds.length > 0) {
      const collectionId = collectionIds[0];
      
      const collectionGamesRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/games",
        `fields id, name, category, platforms; where collections = ${collectionId} & version_title = null; limit 50;`,
        IGDB_ACCESS_TOKEN
      );

      if (collectionGamesRes.ok) {
        const collectionGames = await collectionGamesRes.json();
        gameIds = collectionGames
          .filter((g: any) => !g.version_parent)
          .map((g: any) => g.id);
      }
    }

    // Fall back to franchises
    if (gameIds.length === 0 && franchiseIds.length > 0) {
      const franchiseId = franchiseIds[0];
      
      const franchiseGamesRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/games",
        `fields id, name, category, platforms; where franchises = ${franchiseId} & version_title = null; limit 50;`,
        IGDB_ACCESS_TOKEN
      );

      if (franchiseGamesRes.ok) {
        const franchiseGames = await franchiseGamesRes.json();
        gameIds = franchiseGames
          .filter((g: any) => !g.version_parent)
          .map((g: any) => g.id);
      }
    }

    // If we have game IDs, get details for all of them
    if (gameIds.length === 0) {
      return NextResponse.json({ details: [] });
    }

    // Query all game details with category and platforms
    // IGDB uses parentheses () not brackets [] for arrays
    const idsString = gameIds.join(",");
    const detailsRes = await fetchWithTokenRefresh(
      "https://api.igdb.com/v4/games",
      `fields id, name, category, platforms, version_parent; where id = (${idsString}); limit ${gameIds.length};`,
      IGDB_ACCESS_TOKEN
    );

    if (!detailsRes.ok) {
      throw new Error(`IGDB API error: ${detailsRes.status}`);
    }

    const detailsGames = await detailsRes.json();

    // Also fetch platform names
    const allPlatformIds = new Set<number>();
    detailsGames.forEach((g: any) => {
      g.platforms?.forEach((p: number) => allPlatformIds.add(p));
    });

    let platformNamesMap: Record<number, string> = {};
    if (allPlatformIds.size > 0) {
      const platformIdsString = Array.from(allPlatformIds).join(",");
      const platformsRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/platforms",
        `fields id, name, abbreviation; where id = (${platformIdsString}); limit ${allPlatformIds.size};`,
        IGDB_ACCESS_TOKEN
      );

      if (platformsRes.ok) {
        const platforms = await platformsRes.json();
        platforms.forEach((p: any) => {
          platformNamesMap[p.id] = p.abbreviation || p.name || `Platform ${p.id}`;
        });
      }
    }

    // Format the response
    const details = detailsGames
      .filter((g: any) => !g.version_parent) // Exclude child versions
      .map((g: any) => {
        const type = mapCategoryToType(g.category || 0);
        const platformNames = (g.platforms || []).map((p: number) => 
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
    console.error("Error fetching franchise details:", error);
    return NextResponse.json(
      { error: "Failed to fetch franchise details", details: [] },
      { status: 500 }
    );
  }
}
