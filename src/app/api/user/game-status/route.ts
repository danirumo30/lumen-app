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

    // Return status separately - favorite is independent
    // Determine playing/completed/planned based on progress and flags
    let playStatus: GameStatus = null;
    if (data) {
      if (data.progress_minutes > 0 && data.is_planned) {
        playStatus = "playing";
      }
      else if (data.is_watched) {
        playStatus = "completed";
      }
      else if (data.is_planned) {
        playStatus = "planned";
      }
      // If has record with no progress and not planned/watched, it's like dropped
      else if (data.progress_minutes === 0 && data.is_planned === false && data.is_watched === false) {
        playStatus = "dropped";
      }
    }

    // Favorite is always independent - check separately
    const isFavorite = data?.is_favorite ?? false;

    return NextResponse.json({
      isFavorite,
      playStatus,
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
    const { igdbId, status, isFavorite, playtimeMinutes, gameData } = body;

    console.log("[game-status POST] Received:", { igdbId, status, isFavorite, playtimeMinutes, gameData });

    if (!igdbId) {
      console.log("[game-status POST] Missing igdbId");
      return NextResponse.json({ error: "igdbId required" }, { status: 400 });
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    console.log("[game-status POST] Token present:", !!token);
    
    if (!token) {
      console.log("[game-status POST] No token, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // User client for reading
    const userClient = createUserClient(token);
    // Admin client for writing (bypasses RLS)
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    console.log("[game-status POST] User:", user?.id, "Error:", userError);
    
    if (!user || userError) {
      console.error("[game-status POST] User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure igdbId is a number
    const numericIgdbId = typeof igdbId === 'number' ? igdbId : parseInt(igdbId);
    const mediaId = `igdb_${numericIgdbId}`;
    console.log("[game-status POST] mediaId:", mediaId);
    const gameMinutes = playtimeMinutes || 0;

    // Get current state
    console.log("[game-status POST] Checking existing record for mediaId:", mediaId);
    const { data: existing, error: existingError } = await userClient
      .from("user_media_tracking")
      .select("is_watched, is_favorite, is_planned, progress_minutes")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .single();

    console.log("[game-status POST] Existing record:", existing, "Error:", existingError);

    // Determine flags based on status and isFavorite parameter
    // isFavorite comes from request when doing favorite-only update
    // status comes from request when doing play status update
    const shouldToggleFavorite = isFavorite !== undefined;
    const isFavoriteFinal = shouldToggleFavorite ? isFavorite : (status === "favorite");
    
    const isCompleted = status === "completed";
    const isPlanned = status === "planned" || status === "playing";
    const isDropped = status === "dropped";
    const isPlaying = status === "playing";

    // Calculate progress minutes
    // If adding playtime, add to existing; otherwise use provided value
    let newProgressMinutes = gameMinutes;
    
    if (playtimeMinutes && playtimeMinutes > 0 && existing?.progress_minutes) {
      // Adding more playtime - always set playing
      newProgressMinutes = existing.progress_minutes + playtimeMinutes;
    } else if (isCompleted) {
      // If marking as completed, set some default minutes
      newProgressMinutes = gameMinutes || 60;
    } else if (isPlaying && !existing?.progress_minutes) {
      // Starting to play, set minimum
      newProgressMinutes = 1;
    } else if (isDropped) {
      // If dropped, keep existing minutes
      newProgressMinutes = existing?.progress_minutes || 0;
    } else if (isPlanned && !existing?.progress_minutes) {
      // Planned without playing, no minutes
      newProgressMinutes = 0;
    }

    console.log("[game-status POST] Final flags:", { isFavorite: isFavoriteFinal, isCompleted, isPlanned, isPlaying, newProgressMinutes });

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
      console.log("[game-status POST] Updating existing record");
      const { error } = await adminClient
        .from("user_media_tracking")
        .update({ 
          is_favorite: isFavoriteFinal,  // Keep independent
          is_watched: isCompleted,  // Only for completed
          is_planned: isPlanned || isPlaying,  // For planned OR playing (when has progress)
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
    console.log("[game-status POST] Creating new record with:", {
      user_id: user.id,
      media_id: mediaId,
      media_type: "game",
      is_favorite: isFavoriteFinal,
      is_watched: isCompleted,
      is_planned: isPlanned,
      progress_minutes: newProgressMinutes,
    });

    // First, ensure the game exists in media table (admin to bypass RLS)
    if (gameData || isFavoriteFinal || isPlaying) {
      console.log("[game-status POST] Upserting game in media table", gameData);
      
      // For games, store the full IGDB cover URL (or relative path starting with /)
      let posterPath: string | null = null;
      if (gameData?.coverUrl) {
        // Extract just the IGDB path portion
        // e.g., "https://images.igdb.com/igdb/image/upload/t_cover_big/co8j4n.jpg" -> "/igdb/image/upload/t_cover_big/co8j4n.jpg"
        posterPath = gameData.coverUrl.replace("https://images.igdb.com", "");
      }
      
      console.log("[game-status POST] posterPath:", posterPath);
      
      const { error: mediaError } = await adminClient
        .from("media")
        .upsert({
          id: mediaId,
          type: "game",
          title: gameData?.title || "Game",
          release_year: gameData?.releaseYear,
          poster_path: posterPath,
        }, {
          onConflict: "id",
        });

      if (mediaError) {
        console.log("[game-status POST] Media upsert error:", mediaError);
      } else {
        console.log("[game-status POST] Media upsert successful!");
      }
    }

    // Create new record
    const { error } = await adminClient
        .from("user_media_tracking")
        .insert({
          user_id: user.id,
          media_id: mediaId,
          media_type: "game",
          is_favorite: isFavoriteFinal,
          is_watched: isCompleted,
          is_planned: isPlanned,
          progress_minutes: newProgressMinutes,
        });

      if (error) {
        console.error("[game-status POST] Insert tracking error:", error);
        throw error;
      }
      console.log("[game-status POST] Insert successful!");
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
