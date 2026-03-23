import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create client with user token (for reading)
function createUserClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Create admin client (bypasses RLS) for writes
function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type GameStatus = "favorite" | "playing" | "completed" | "dropped" | "planned" | null;

// Get user's game status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const igdbId = searchParams.get("igdbId");
    
    if (!igdbId) {
      return NextResponse.json({ error: "igdbId required" }, { status: 400 });
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ 
        status: null, 
        playtimeMinutes: 0, 
        startedAt: null, 
        completedAt: null 
      });
    }

    const supabase = createUserClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        status: null, 
        playtimeMinutes: 0, 
        startedAt: null, 
        completedAt: null 
      });
    }
    
    const mediaId = `igdb_${igdbId}`;
    
    // Check user_media_tracking for game status
    const { data, error } = await supabase
      .from("user_media_tracking")
      .select("is_watched, is_favorite, is_planned, progress_minutes, updated_at, created_at")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[game-status GET] Error:", error);
    }

    // Determine status based on flags
    let status: GameStatus = null;
    if (data) {
      if (data.is_favorite) status = "favorite";
      else if (data.is_watched) status = "completed";
      else if (data.is_planned) status = "planned";
      else if (data.progress_minutes > 0) status = "playing";
    }

    return NextResponse.json({
      status,
      playtimeMinutes: data?.progress_minutes ?? 0,
      startedAt: data?.created_at || null,
      completedAt: data?.is_watched ? data.updated_at : null,
    });
  } catch (error) {
    console.error("[game-status GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch game status" },
      { status: 500 }
    );
  }
}

// Update game status
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { igdbId, status, playtimeMinutes, gameData } = body;

    if (!igdbId) {
      return NextResponse.json({ error: "igdbId required" }, { status: 400 });
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User client for reading
    const userClient = createUserClient(token);
    // Admin client for writing (bypasses RLS)
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (!user || userError) {
      console.error("[game-status POST] User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mediaId = `igdb_${igdbId}`;
    const gameMinutes = playtimeMinutes || 0;

    // Get current state
    const { data: existing } = await userClient
      .from("user_media_tracking")
      .select("is_watched, is_favorite, is_planned, progress_minutes")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .single();

    // Determine flags based on status
    const isFavorite = status === "favorite";
    const isPlanned = status === "planned";
    const isCompleted = status === "completed";
    const isDropped = status === "dropped";
    const isPlaying = status === "playing";

    // Calculate progress minutes
    // If adding playtime, add to existing; otherwise use provided value
    let newProgressMinutes = gameMinutes;
    if (playtimeMinutes && playtimeMinutes > 0 && existing?.progress_minutes) {
      newProgressMinutes = existing.progress_minutes + playtimeMinutes;
    } else if (isCompleted && !isDropped) {
      // If marking as completed, use provided minutes or default
      newProgressMinutes = gameMinutes || 60; // Default 1 hour
    } else if (isDropped) {
      // If dropped, keep existing minutes
      newProgressMinutes = existing?.progress_minutes || 0;
    }

    // Handle "remove" status - delete the record
    if (status === "remove" || status === null) {
      if (existing) {
        const { error: deleteError } = await adminClient
          .from("user_media_tracking")
          .delete()
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (deleteError) {
          console.error("[game-status POST] Delete error:", deleteError);
          throw deleteError;
        }
      }
      return NextResponse.json({ success: true, status: null });
    }

    // Upsert the tracking record
    if (existing) {
      const { error } = await adminClient
        .from("user_media_tracking")
        .update({ 
          is_favorite: isFavorite,
          is_watched: isCompleted,
          is_planned: isPlanned,
          progress_minutes: newProgressMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("media_id", mediaId);

      if (error) {
        console.error("[game-status POST] Update tracking error:", error);
        throw error;
      }
    } else {
      // Create new record
      const { error } = await adminClient
        .from("user_media_tracking")
        .insert({
          user_id: user.id,
          media_id: mediaId,
          media_type: "game",
          is_favorite: isFavorite,
          is_watched: isCompleted,
          is_planned: isPlanned,
          progress_minutes: newProgressMinutes,
        });

      if (error) {
        console.error("[game-status POST] Insert tracking error:", error);
        throw error;
      }
    }

    return NextResponse.json({ 
      success: true, 
      status,
      playtimeMinutes: newProgressMinutes 
    });
  } catch (error) {
    console.error("[game-status POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update game status" },
      { status: 500 }
    );
  }
}
