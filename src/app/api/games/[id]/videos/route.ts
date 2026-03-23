import { NextResponse } from "next/server";

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

async function fetchGameVideos(accessToken: string, igdbId: number, retry = false): Promise<Response> {
  const response = await fetch("https://api.igdb.com/v4/game_videos", {
    method: "POST",
    headers: {
      "Client-ID": IGDB_CLIENT_ID,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: `
      fields video_id, name;
      where game = ${igdbId};
      limit 20;
    `,
  });

  if (response.status === 401 && !retry) {
    const newToken = await getFreshAccessToken();
    process.env.IGDB_ACCESS_TOKEN = newToken;
    return fetchGameVideos(newToken, igdbId, true);
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

    const videosRes = await fetchGameVideos(IGDB_ACCESS_TOKEN, igdbId);

    if (!videosRes.ok) {
      throw new Error(`IGDB API error`);
    }

    const videos = await videosRes.json();

    // Format videos - IGDB video_id is usually a YouTube video ID
    const formattedVideos = videos.map((v: { video_id: string; name: string }) => ({
      id: v.video_id,
      name: v.name,
      // YouTube thumbnail URL
      thumbnailUrl: `https://img.youtube.com/vi/${v.video_id}/hqdefault.jpg`,
      // YouTube watch URL
      watchUrl: `https://www.youtube.com/watch?v=${v.video_id}`,
    }));

    return NextResponse.json({ videos: formattedVideos });
  } catch (error) {
    console.error("Error fetching game videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch game videos", videos: [] },
      { status: 500 }
    );
  }
}
