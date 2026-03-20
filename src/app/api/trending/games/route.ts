import { writeFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN!;
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID!;
const IGDB_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!;
const ENV_PATH = join(process.cwd(), ".env.local");

export const runtime = "edge";

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

async function refreshTokenAndUpdateEnv(): Promise<string> {
  const newToken = await getFreshAccessToken();
  
  // Update .env.local with new token
  try {
    const currentEnv = require("fs").readFileSync(ENV_PATH, "utf-8");
    const updatedEnv = currentEnv.replace(
      /IGDB_ACCESS_TOKEN=.*/,
      `IGDB_ACCESS_TOKEN=${newToken}`
    );
    require("fs").writeFileSync(ENV_PATH, updatedEnv);
    console.log("IGDB access token refreshed and saved to .env.local");
  } catch {
    console.warn("Could not update .env.local file");
  }
  
  return newToken;
}

async function fetchGames(accessToken: string, retry = false): Promise<Response> {
  const response = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: `
      fields id, name, cover.url, rating, first_release_date, summary;
      where rating != null & first_release_date != null;
      sort rating desc;
      limit 20;
    `,
    next: { revalidate: 3600 },
  });

  // If 401 and haven't retried, refresh token and retry
  if (response.status === 401 && !retry) {
    console.log("IGDB token expired, refreshing...");
    const newToken = await refreshTokenAndUpdateEnv();
    return fetchGames(newToken, true);
  }

  return response;
}

export async function GET() {
  try {
    const igdbResponse = await fetchGames(IGDB_ACCESS_TOKEN);

    if (!igdbResponse.ok) {
      throw new Error(`IGDB API error: ${igdbResponse.status}`);
    }

    const games = await igdbResponse.json();

    const results = games.map((game: {
      id: number;
      name: string;
      cover?: { url: string };
      rating?: number;
      first_release_date?: number;
      summary?: string;
    }) => ({
      id: `igdb_${game.id}`,
      name: game.name,
      coverUrl: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
      rating: game.rating ? Math.round(game.rating / 10) : null,
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
        : null,
      summary: game.summary,
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error fetching trending games:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending games" },
      { status: 500 }
    );
  }
}
