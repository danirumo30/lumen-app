import { logger } from '@/shared/logger';
import { NextResponse } from "next/server";

const IGDB_ACCESS_TOKEN = process.env.IGDB_ACCESS_TOKEN || "";
const IGDB_CLIENT_ID = process.env.TWITCH_CLIENT_ID || "";

export const runtime = "nodejs";

interface ImageResult {
  url: string;
  type: "screenshot" | "artwork";
  width: number;
  height: number;
}

interface MediaResponse {
  images: ImageResult[];
}

const mediaCache = new Map<string, { data: MediaResponse; timestamp: number }>();
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

async function fetchGameMedia(accessToken: string, igdbId: number, retry = false): Promise<Response> {
  const response = await fetch("https://api.igdb.com/v4/screenshots", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: `
      fields url, width, height;
      where game = ${igdbId};
      sort width desc;
      limit 20;
    `,
  });

  if (response.status === 401 && !retry) {
    const newToken = await getFreshAccessToken();
    process.env.IGDB_ACCESS_TOKEN = newToken;
    return fetchGameMedia(newToken, igdbId, true);
  }

  return response;
}

async function fetchGameArtworks(accessToken: string, igdbId: number, retry = false): Promise<Response> {
  const response = await fetch("https://api.igdb.com/v4/artworks", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: `
      fields url, width, height;
      where game = ${igdbId};
      sort width desc;
      limit 10;
    `,
  });

  if (response.status === 401 && !retry) {
    const newToken = await getFreshAccessToken();
    process.env.IGDB_ACCESS_TOKEN = newToken;
    return fetchGameArtworks(newToken, igdbId, true);
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

    const cacheKey = `media_${igdbId}`;
    const cached = mediaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    const [screenshotsRes, artworksRes] = await Promise.all([
      fetchGameMedia(IGDB_ACCESS_TOKEN, igdbId),
      fetchGameArtworks(IGDB_ACCESS_TOKEN, igdbId),
    ]);

    if (!screenshotsRes.ok || !artworksRes.ok) {
      throw new Error(`IGDB API error`);
    }

    const screenshots = await screenshotsRes.json();
    const artworks = await artworksRes.json();

    const images = [
      ...screenshots.map((s: { url: string; width: number; height: number }) => ({
        url: `https:${s.url.replace("t_thumb", "t_720p")}`,
        type: "screenshot" as const,
        width: s.width,
        height: s.height,
      })),
      ...artworks.map((a: { url: string; width: number; height: number }) => ({
        url: `https:${a.url.replace("t_thumb", "t_720p")}`,
        type: "artwork" as const,
        width: a.width,
        height: a.height,
      })),
    ];

    const result = { images };
    mediaCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Error fetching game media:", error);
    return NextResponse.json(
      { error: "Failed to fetch game media", images: [] },
      { status: 500 }
    );
  }
}

