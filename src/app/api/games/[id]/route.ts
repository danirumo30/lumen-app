import { NextResponse } from "next/server";
import { mapGenresToSpanish, translateText } from "@/lib/translate";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";
const IGDB_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || "";

console.log("[games/[id]] IGDB_ACCESS_TOKEN present:", !!IGDB_ACCESS_TOKEN);
console.log("[games/[id]] IGDB_CLIENT_ID present:", !!IGDB_CLIENT_ID);

export const runtime = "nodejs";

async function getFreshAccessToken(): Promise<string> {
  const tokenResponse = await fetch(
    "https://id.twitch.tv/oauth2/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: IGDB_CLIENT_ID,
        client_secret: IGDB_CLIENT_SECRET,
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

async function fetchGameById(accessToken: string, igdbId: number, retry = false): Promise<Response> {
  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: `
      fields id, name, cover.url, rating, summary, genres.name, platforms.name, first_release_date, involved_companies.company.name;
      where id = ${igdbId};
      limit 1;
    `,
  });

  // If 401 and haven't retried, refresh token and retry
  if (response.status === 401 && !retry) {
    console.log("IGDB token expired, refreshing...");
    const newToken = await getFreshAccessToken();
    process.env.IGDB_ACCESS_TOKEN = newToken;
    return fetchGameById(newToken, igdbId, true);
  }

  return response;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Remove 'igdb_' prefix if present
    const igdbId = parseInt(id.replace(/^igdb_/, ''));

    if (isNaN(igdbId)) {
      return NextResponse.json(
        { error: "Invalid IGDB ID" },
        { status: 400 }
      );
    }

    const igdbResponse = await fetchGameById(IGDB_ACCESS_TOKEN, igdbId);

    console.log("[games/[id]] IGDB response status:", igdbResponse.status);
    
    if (!igdbResponse.ok) {
      const errorText = await igdbResponse.text();
      console.log("[games/[id]] IGDB error response:", errorText);
      throw new Error(`IGDB API error: ${igdbResponse.status} - ${errorText}`);
    }

    const games = await igdbResponse.json();

    if (!games || games.length === 0) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    const game = games[0];

    // Get English genres and translate to Spanish
    const englishGenres = game.genres?.map((g: { name: string }) => g.name) || [];
    const genres = mapGenresToSpanish(englishGenres);

    // Translate summary to Spanish (await inside async context)
    let summary: string | null = game.summary || null;
    if (game.summary) {
      summary = await translateText(game.summary, "es");
    }

    const result = {
      id: `igdb_${game.id}`,
      igdbId: game.id,
      name: game.name,
      coverUrl: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
      summary,
      genres,
      platforms: game.platforms?.map((p: { name: string }) => p.name) || [],
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
        : null,
      releaseYear: game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : null,
      rating: game.rating ? Math.round(game.rating / 10) : null,
      involvedCompanies: game.involved_companies?.map((c: { company: { name: string } }) => c.company.name) || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching game details:", error);
    return NextResponse.json(
      { error: "Failed to fetch game details" },
      { status: 500 }
    );
  }
}
