import { NextResponse } from "next/server";
import { mapGenresToSpanish } from "@/lib/translate";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";

// Cache for similar games
const similarCache = new Map<string, { data: any; timestamp: number }>();
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
    const cacheKey = `similar_${igdbId}`;
    const cached = similarCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // Step 1: Get the game to extract similar_games and genres IDs
    const gameRes = await fetchWithTokenRefresh(
      "https://api.igdb.com/v4/games",
      `fields id, name, similar_games, genres; where id = ${igdbId}; limit 1;`,
      IGDB_ACCESS_TOKEN
    );

    if (!gameRes.ok) {
      throw new Error(`IGDB API error`);
    }

    const games = await gameRes.json();
    const currentGame = games[0];

    // Collect similar game IDs
    const similarIds = currentGame.similar_games || [];
    // Remove the current game from similar
    const filteredSimilarIds = similarIds.filter((id: number) => id !== igdbId);

    let allSimilarGames: any[] = [];

    // Step 2: If we have similar_games, fetch them directly
    if (filteredSimilarIds.length > 0) {
      const idsString = filteredSimilarIds.join(",");
      const similarRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/games",
        `fields id, name, cover.url, rating, genres.name, first_release_date, version_parent, category; where id = (${idsString}) & version_title = null; sort rating desc; limit 20;`,
        IGDB_ACCESS_TOKEN
      );

      if (similarRes.ok) {
        const data = await similarRes.json();
        allSimilarGames = data.filter((g: any) => g.id !== igdbId && !g.version_parent);
      }
    }

    // Step 3: If not enough similar games, fall back to genre-based search
    if (allSimilarGames.length < 5 && currentGame.genres?.length > 0) {
      const genreIds = currentGame.genres.map((g: any) => g.id).join(",");
      
      const genreBasedRes = await fetchWithTokenRefresh(
        "https://api.igdb.com/v4/games",
        `fields id, name, cover.url, rating, genres.name, first_release_date, version_parent, category; where genres = [${genreIds}] & version_title = null & id != ${igdbId}; sort rating desc; limit 20;`,
        IGDB_ACCESS_TOKEN
      );

      if (genreBasedRes.ok) {
        const genreGames = await genreBasedRes.json();
        const filteredGenreGames = genreGames.filter((g: any) => g.id !== igdbId && !g.version_parent);

        // Merge, avoiding duplicates
        const existingIds = new Set(allSimilarGames.map((g: any) => g.id));
        for (const game of filteredGenreGames) {
          if (!existingIds.has(game.id)) {
            allSimilarGames.push(game);
          }
        }
      }
    }

    const formattedGames = allSimilarGames.slice(0, 15)
      .filter((g: any) => {
        // Only include main games (category 0 or undefined), exclude DLCs, expansions, etc.
        return g.category === undefined || g.category === 0;
      })
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

    const result = { games: formattedGames };
    similarCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching similar games:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar games", games: [] },
      { status: 500 }
    );
  }
}
