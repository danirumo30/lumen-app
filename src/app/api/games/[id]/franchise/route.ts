import { NextResponse } from "next/server";
import { mapGenresToSpanish } from "@/lib/translate";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";

// Cache for franchise data
const franchiseCache = new Map<string, { data: any; timestamp: number }>();
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
    const cacheKey = `franchise_${igdbId}`;
    const cached = franchiseCache.get(cacheKey);
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
      return NextResponse.json({ franchise: null, games: [] });
    }

    const game = games[0];
    
    // Try collections first (more relevant for game series)
    const collectionIds = game.collections || [];
    const franchiseIds = game.franchises || [];

    // If we have collections, use those
    if (collectionIds.length > 0) {
      const collectionId = collectionIds[0];

      // Get collection name
      const collectionRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/collections",
        `fields name; where id = ${collectionId}; limit 1;`,
        IGDB_ACCESS_TOKEN
      );

      let collectionName = "Colección";
      if (collectionRes.ok) {
        const collectionData = await collectionRes.json();
        if (collectionData && collectionData[0]?.name) {
          collectionName = collectionData[0].name;
        }
      }

      // Get all games in this collection
      const collectionGamesRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/games",
        `fields id, name, cover.url, rating, genres.name, first_release_date, version_parent; where collections = ${collectionId} & version_title = null; sort first_release_date asc; limit 50;`,
        IGDB_ACCESS_TOKEN
      );

      if (!collectionGamesRes.ok) {
        throw new Error(`IGDB API error: ${collectionGamesRes.status}`);
      }

      const collectionGames = await collectionGamesRes.json();

      const formattedGames = collectionGames
        .filter((g: any) => !g.version_parent)
        .map((g: any) => ({
          id: `igdb_${g.id}`,
          igdbId: g.id,
          name: g.name,
          posterUrl: g.cover?.url
            ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
            : null,
          releaseDate: g.first_release_date
            ? new Date(g.first_release_date * 1000).toISOString().split("T")[0]
            : null,
          releaseYear: g.first_release_date
            ? new Date(g.first_release_date * 1000).getFullYear()
            : null,
          rating: g.rating ? Math.round(g.rating / 10) : null,
          genres: mapGenresToSpanish(g.genres?.map((g: { name: string }) => g.name) || []),
        }));

      const result = {
        franchise: {
          id: collectionId,
          name: collectionName,
        },
        games: formattedGames,
      };
      franchiseCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    // Fall back to franchises if no collections
    if (franchiseIds.length > 0) {
      const franchiseId = franchiseIds[0];

      const franchiseRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/franchises",
        `fields name; where id = ${franchiseId}; limit 1;`,
        IGDB_ACCESS_TOKEN
      );

      let franchiseName = "Franchise";
      if (franchiseRes.ok) {
        const franchiseData = await franchiseRes.json();
        if (franchiseData && franchiseData[0]?.name) {
          franchiseName = franchiseData[0].name;
        }
      }

      const franchiseGamesRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/games",
        `fields id, name, cover.url, rating, genres.name, first_release_date, version_parent; where franchises = ${franchiseId} & version_title = null; sort first_release_date asc; limit 50;`,
        IGDB_ACCESS_TOKEN
      );

      if (!franchiseGamesRes.ok) {
        throw new Error(`IGDB API error: ${franchiseGamesRes.status}`);
      }

      const franchiseGames = await franchiseGamesRes.json();

      const formattedGames = franchiseGames
        .filter((g: any) => !g.version_parent)
        .map((g: any) => ({
          id: `igdb_${g.id}`,
          igdbId: g.id,
          name: g.name,
          posterUrl: g.cover?.url
            ? `https:${g.cover.url.replace("t_thumb", "t_cover_big")}`
            : null,
          releaseDate: g.first_release_date
            ? new Date(g.first_release_date * 1000).toISOString().split("T")[0]
            : null,
          releaseYear: g.first_release_date
            ? new Date(g.first_release_date * 1000).getFullYear()
            : null,
          rating: g.rating ? Math.round(g.rating / 10) : null,
          genres: mapGenresToSpanish(g.genres?.map((g: { name: string }) => g.name) || []),
        }));

      const result = {
        franchise: {
          id: franchiseId,
          name: franchiseName,
        },
        games: formattedGames,
      };
      franchiseCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    // No collection or franchise found
    return NextResponse.json({ franchise: null, games: [] });
  } catch (error) {
    console.error("Error fetching franchise:", error);
    return NextResponse.json(
      { error: "Failed to fetch franchise", franchise: null, games: [] },
      { status: 500 }
    );
  }
}
