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

    // Get DLCs for this game
    const dlcsRes = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": IGDB_CLIENT_ID,
        Authorization: `Bearer ${IGDB_ACCESS_TOKEN}`,
        "Content-Type": "text/plain",
      },
      body: `
        fields id, name, cover.url, rating, genres.name, first_release_date, category;
        where dlcs = ${igdbId};
        sort first_release_date desc;
        limit 50;
      `,
    });

    if (!dlcsRes.ok) {
      throw new Error(`IGDB API error`);
    }

    const dlcs = await dlcsRes.json();

    // category 1 = DLC, category 0 = main game
    const formattedDLCs = dlcs
      .filter((g: any) => g.category === 1)
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

    return NextResponse.json({ dlcs: formattedDLCs });
  } catch (error) {
    console.error("Error fetching DLCs:", error);
    return NextResponse.json(
      { error: "Failed to fetch DLCs", dlcs: [] },
      { status: 500 }
    );
  }
}
