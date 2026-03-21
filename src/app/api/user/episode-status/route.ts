import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create user client with token
function createUserClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Create admin client (bypasses RLS)
function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Get watched episodes for a TV show
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get("tmdbId");
    
    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ watchedEpisodes: [] });
    }

    const userClient = createUserClient(token);
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (!user || userError) {
      return NextResponse.json({ watchedEpisodes: [] });
    }

    const mediaIdPrefix = `tv_${tmdbId}_s`;
    
    // Query for episodes that match the pattern tv_${tmdbId}_sX_eY
    // Supabase client has a default limit of 1000, so we need to use pagination
    // to get all episodes for large series like One Piece (1194 episodes)
    const BATCH_SIZE = 1000;
    const allData: Array<{ media_id: string; is_watched: boolean }> = [];
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await userClient
        .from("user_media_tracking")
        .select("media_id, is_watched")
        .eq("user_id", user.id)
        .like("media_id", `${mediaIdPrefix}%`)
        .eq("is_watched", true)
        .range(offset, offset + BATCH_SIZE - 1);
      
      if (error) {
        console.error("[episode-status GET] Error:", error);
        return NextResponse.json({ error: "Failed to fetch watched episodes" }, { status: 500 });
      }
      
      if (data && data.length > 0) {
        allData.push(...data);
        // If we got fewer than BATCH_SIZE, we're done
        hasMore = data.length === BATCH_SIZE;
        offset += BATCH_SIZE;
      } else {
        hasMore = false;
      }
    }

    const data = allData;

    // Parse episode IDs to extract season and episode numbers
    const watchedEpisodes = (data || [])
      .map(row => {
        const match = row.media_id.match(/tv_(\d+)_s(\d+)_e(\d+)/);
        if (match) {
          return {
            tmdbId: parseInt(match[1]),
            seasonNumber: parseInt(match[2]),
            episodeNumber: parseInt(match[3]),
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({ watchedEpisodes });
  } catch (error) {
    console.error("[episode-status GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch watched episodes" },
      { status: 500 }
    );
  }
}

// Mark multiple episodes as watched (batch operation)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tvTmdId, episodes, markAll = false } = body;

    if (!tvTmdId || !episodes || !Array.isArray(episodes)) {
      return NextResponse.json({ error: "tvTmdId and episodes array required" }, { status: 400 });
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userClient = createUserClient(token);
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (!user || userError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mediaId = `tv_${tvTmdId}`;
    const results = { marked: 0, errors: 0 };

    // Separate episodes into toUpsert and toDelete
    const toUpsert = [];
    const toDelete = [];
    
    for (const episode of episodes) {
      const { seasonNumber, episodeNumber, watched, runtime } = episode;
      const episodeMediaId = `${mediaId}_s${seasonNumber}_e${episodeNumber}`;
      // Use runtime if available, otherwise use default 24 minutes (typical TV episode)
      // This ensures stats are calculated even if TMDB doesn't provide runtime
      const DEFAULT_EPISODE_RUNTIME = 24;
      const progressMinutes = watched ? (runtime && runtime > 0 ? runtime : DEFAULT_EPISODE_RUNTIME) : 0;
      
      if (watched) {
        toUpsert.push({
          user_id: user.id,
          media_id: episodeMediaId,
          media_type: "tv",
          is_watched: true,
          is_favorite: false,
          is_planned: false,
          progress_minutes: progressMinutes,
          updated_at: new Date().toISOString(),
        });
      } else {
        toDelete.push(episodeMediaId);
      }
    }

    // BULK operations - let the DB trigger handle user_tv_progress automatically
    if (toUpsert.length > 0) {
      // Bulk upsert all episodes at once
      const { error: upsertError } = await adminClient
        .from("user_media_tracking")
        .upsert(toUpsert, { 
          onConflict: "user_id,media_id",
          ignoreDuplicates: false,
        });
      
      if (upsertError) {
        console.error("[episode-status] Bulk upsert error:", upsertError);
        results.errors += toUpsert.length;
      } else {
        results.marked += toUpsert.length;
      }
    }

    if (toDelete.length > 0) {
      // Bulk delete all episodes at once
      const { error: deleteError } = await adminClient
        .from("user_media_tracking")
        .delete()
        .eq("user_id", user.id)
        .in("media_id", toDelete);
      
      if (deleteError) {
        console.error("[episode-status] Bulk delete error:", deleteError);
        results.errors += toDelete.length;
      } else {
        results.marked += toDelete.length;
      }
    }

    // The trigger `update_tv_progress_trigger` will automatically:
    // 1. Calculate total minutes from all episodes for this TV series
    // 2. Upsert into user_tv_progress
    // This ensures instant, accurate statistics
    
    return NextResponse.json({
      success: results.errors === 0,
      marked: results.marked,
      errors: results.errors,
    });
  } catch (error) {
    console.error("[episode-status POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update episode status" },
      { status: 500 }
    );
  }
}
