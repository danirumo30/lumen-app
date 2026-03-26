import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import { mapGenresToSpanish, mapGameModesToSpanish, translateText } from "@/lib/translate";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";
const IGDB_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || "";

export const runtime = "nodejs";

interface GameResult {
  id: string;
  igdbId: number;
  name: string;
  coverUrl: string | null;
  summary: string | null;
  genres: string[];
  gameModes: string[];
  platforms: string[];
  releaseDate: string | null;
  releaseYear: number | null;
  rating: number | null;
  involvedCompanies: string[];
}

// Simple in-memory cache for game data
const gameCache = new Map<string, { data: GameResult; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

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
      fields id, name, cover.url, rating, summary, genres.name, game_modes.name, platforms.name, first_release_date, involved_companies.company.name;
      where id = ${igdbId};
      limit 1;
    `,
  });

  if (response.status === 401 && !retry) {
    logger.debug("IGDB token expired, refreshing...");
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

    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const browserLang = acceptLanguage.split(',')[0].split('-')[0]; // Get primary language code
    const targetLang = browserLang === 'es' ? 'es' : browserLang === 'fr' ? 'fr' : browserLang === 'de' ? 'de' : browserLang === 'it' ? 'it' : browserLang === 'pt' ? 'pt' : 'es'; // Default to Spanish
    

    const cacheKey = `game_${igdbId}_${targetLang}`;
    const cached = gameCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug(`[games/[id]] Cache hit for game ${igdbId} in ${targetLang}`);
      return NextResponse.json(cached.data);
    }

    const igdbResponse = await fetchGameById(IGDB_ACCESS_TOKEN, igdbId);

    
    if (!igdbResponse.ok) {
      const errorText = await igdbResponse.text();
      logger.debug("[games/[id]] IGDB error response:", errorText);
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

    const englishGenres = game.genres?.map((g: { name: string }) => g.name) || [];
    const genres = mapGenresToSpanish(englishGenres);

    // Translate summary to browser language (skip if English)
    let summary: string | null = game.summary || null;
    const shouldTranslate = browserLang !== 'en' && summary && summary.trim() !== '';
    
    if (shouldTranslate) {
      try {
        summary = await translateText(summary!, targetLang);
      } catch (error) {
        logger.error("[games/[id]] Translation failed, using original:", error);
        // Keep original English summary if translation fails
      }
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
      gameModes: mapGameModesToSpanish(game.game_modes?.map((m: { name: string }) => m.name) || []),
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

    gameCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching game details:", error);
    return NextResponse.json(
      { error: "Failed to fetch game details" },
      { status: 500 }
    );
  }
}




