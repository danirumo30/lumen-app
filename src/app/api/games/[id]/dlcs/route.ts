import { logger } from '@/shared/logger';
import { NextResponse } from "next/server";
import { mapGenresToSpanish } from "@/shared/translate";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";

interface DlcResult {
  id: string;
  igdbId: number;
  name: string;
  posterUrl: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  genres: string[];
  category: number;
  isStandaloneExpansion: boolean;
}

interface DlcsResponse {
  dlcs: DlcResult[];
}

interface IgdbGameContent {
  id: number;
  dlcs?: number[];
  expansions?: number[];
  standalone_expansions?: number[];
  bundles?: number[];
}

interface IgdbContentGame {
  id: number;
  name: string;
  cover?: { url: string };
  rating?: number;
  first_release_date?: number;
  category?: number;
  parent_game?: number;
  genres?: { name: string }[];
}

const dlcsCache = new Map<string, { data: DlcsResponse; timestamp: number }>();
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

    
    const gameRes = await fetchWithTokenRefresh(
      "https://api.igdb.com/v4/games",
      `fields id, dlcs, expansions, standalone_expansions, bundles; where id = ${igdbId}; limit 1;`,
      IGDB_ACCESS_TOKEN
    );

    if (!gameRes.ok) {
      throw new Error(`IGDB API error`);
    }

     const games = await gameRes.json() as IgdbGameContent[];
     const game = games[0];

    const contentIds = [
      ...(game.dlcs || []),
      ...(game.expansions || []),
      ...(game.standalone_expansions || []),
      ...(game.bundles || [])
    ];

    
    const uniqueIds = [...new Set(contentIds)].filter(id => id !== igdbId);

    if (uniqueIds.length === 0) {
      return NextResponse.json({ dlcs: [], additionalContent: [] });
    }

    
    const idsString = uniqueIds.join(",");
    const contentRes = await fetchWithTokenRefresh(
      "https://api.igdb.com/v4/games",
      `fields id, name, cover.url, rating, genres.name, first_release_date, category, parent_game; where id = (${idsString}); sort first_release_date desc; limit 50;`,
      IGDB_ACCESS_TOKEN
    );

    if (!contentRes.ok) {
      throw new Error(`IGDB API error`);
    }

     const allContent = await contentRes.json() as IgdbContentGame[];

     
     
     
     const formattedDlcs = allContent
       .filter((g) => {
         if (g.id === igdbId) return false;
         
         const isDlc = g.category === 1 || g.category === 2 || g.category === 8;
         return isDlc || g.parent_game === igdbId;
       })
       .map((g) => ({
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
         genres: mapGenresToSpanish(g.genres?.map((genre) => genre.name) || []),
         category: g.category || 0,
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

