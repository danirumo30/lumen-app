import { NextResponse } from "next/server";
import { mapGenresToSpanish } from "@/lib/translate";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";

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

    // First get the game to find its franchise
    const gameRes = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": IGDB_CLIENT_ID,
        Authorization: `Bearer ${IGDB_ACCESS_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: `
        fields franchises.name;
        where id = ${igdbId};
        limit 1;
      `,
    });

    if (!gameRes.ok) {
      throw new Error(`IGDB API error`);
    }

    const games = await gameRes.json();
    
    if (!games || games.length === 0 || !games[0].franchises || games[0].franchises.length === 0) {
      return NextResponse.json({ franchise: null, games: [] });
    }

    const franchiseId = games[0].franchises[0];
    const franchiseName = games[0].franchises.name;

    // Now get all games in this franchise
    const franchiseGamesRes = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": IGDB_CLIENT_ID,
        Authorization: `Bearer ${IGDB_ACCESS_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: `
        fields id, name, cover.url, rating, genres.name, first_release_date, version_parent;
        where franchises = ${franchiseId} & version_title = null;
        sort first_release_date asc;
        limit 50;
      `,
    });

    if (!franchiseGamesRes.ok) {
      throw new Error(`IGDB API error`);
    }

    const franchiseGames = await franchiseGamesRes.json();

    const formattedGames = franchiseGames
      .filter((g: any) => !g.version_parent) // Exclude version updates
      .map((game: any) => ({
        id: `igdb_${game.id}`,
        igdbId: game.id,
        name: game.name,
        posterUrl: game.cover?.url
          ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
          : null,
        releaseDate: game.first_release_date
          ? new Date(game.first_release_date * 1000).toISOString().split("T")[0]
          : null,
        releaseYear: game.first_release_date
          ? new Date(game.first_release_date * 1000).getFullYear()
          : null,
        rating: game.rating ? Math.round(game.rating / 10) : null,
        genres: mapGenresToSpanish(game.genres?.map((g: { name: string }) => g.name) || []),
      }));

    return NextResponse.json({
      franchise: {
        id: franchiseId,
        name: franchiseName,
      },
      games: formattedGames,
    });
  } catch (error) {
    console.error("Error fetching franchise:", error);
    return NextResponse.json(
      { error: "Failed to fetch franchise", franchise: null, games: [] },
      { status: 500 }
    );
  }
}
