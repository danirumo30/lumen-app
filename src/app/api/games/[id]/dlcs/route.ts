import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import { mapGenresToSpanish } from "@/lib/translate";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";

const dlcsCache = new Map<string, { data: any; timestamp: number }>();
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

    const cacheKey = `dlcs_${igdbId}`;
    const cached = dlcsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Step 1: Get the game to extract dlcs, expansions, standalone_expansions, bundles IDs
    const gameRes = await fetchWithTokenRefresh(
      "https://api.igdb.com/v4/games",
      `fields id, dlcs, expansions, standalone_expansions, bundles; where id = ${igdbId}; limit 1;`,
      IGDB_ACCESS_TOKEN
    );

    if (!gameRes.ok) {
      throw new Error(`IGDB API error`);
    }

    const games = await gameRes.json();
    const game = games[0];

    const contentIds = [
      ...(game.dlcs || []),
      ...(game.expansions || []),
      ...(game.standalone_expansions || []),
      ...(game.bundles || [])
    ];

    // Remove duplicates and filter out the game itself
    const uniqueIds = [...new Set(contentIds)].filter(id => id !== igdbId);

    if (uniqueIds.length === 0) {
      return NextResponse.json({ dlcs: [], additionalContent: [] });
    }

    // Step 2: Fetch all content by their IDs
    const idsString = uniqueIds.join(",");
    const contentRes = await fetchWithTokenRefresh(
      "https://api.igdb.com/v4/games",
      `fields id, name, cover.url, rating, genres.name, first_release_date, category, parent_game; where id = (${idsString}); sort first_release_date desc; limit 50;`,
      IGDB_ACCESS_TOKEN
    );

    if (!contentRes.ok) {
      throw new Error(`IGDB API error`);
    }

    const allContent = await contentRes.json();

    // Separate DLCs from other content
    // category: 0 = main game, 1 = DLC, 2 = expansion, 3 = bundle
    // We want DLCs and standalone expansions
    const formattedDlcs = allContent
      .filter((g: any) => {
        if (g.id === igdbId) return false;
        // Include DLCs (category 1), Expansions (category 2/8), or items in dlcs/expansions/standalone_expansions/bundles arrays
        const isDlc = g.category === 1 || g.category === 2 || g.category === 8;
        return isDlc || g.parent_game === igdbId;
      })
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
        category: g.category,
        isStandaloneExpansion: game.standalone_expansions?.includes(g.id) || false,
      }));

    const result = { dlcs: formattedDlcs };
    dlcsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching additional content:", error);
    return NextResponse.json(
      { error: "Failed to fetch additional content", dlcs: [] },
      { status: 500 }
    );
  }
}

