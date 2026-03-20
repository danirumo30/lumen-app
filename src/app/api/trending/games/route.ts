import { NextResponse } from "next/server";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN!;
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID || "your-client-id";

export const runtime = "edge";

export async function GET() {
  try {
    // Get OAuth token (IGDB requires fresh token each request or cached)
    const tokenResponse = await fetch(
      "https://id.twitch.tv/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: IGDB_CLIENT_ID,
          client_secret: process.env.IGDB_CLIENT_SECRET || "",
          grant_type: "client_credentials",
        }),
      }
    );

    if (!tokenResponse.ok) {
      // Fallback to cached access token if available
      if (!IGDB_ACCESS_TOKEN) {
        throw new Error("No IGDB access token available");
      }
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token || IGDB_ACCESS_TOKEN;

    // Query IGDB for popular games
    const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
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
      next: { revalidate: 3600 }, // Cache 1 hour
    });

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
