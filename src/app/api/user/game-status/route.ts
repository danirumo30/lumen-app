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
        isFavorite: false, 
        playStatus: null, 
        playtimeMinutes: 0, 
        startedAt: null, 
        completedAt: null 
      });
    }

    const supabase = createUserClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ 
        isFavorite: false, 
        playStatus: null, 
        playtimeMinutes: 0, 
        startedAt: null, 
        completedAt: null 
      });
    }
    
    const mediaId = `igdb_${igdbId}`;
    
    // Check user_media_tracking for game status
    const { data, error } = await supabase
      .from("user_media_tracking")
      .select("is_watched, is_favorite, is_planned, progress_minutes, has_platinum, updated_at, created_at")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[game-status GET] Error:", error);
    }

    // Favorite is always independent - check separately
    const isFavorite = data?.is_favorite ?? false;
    
    // Determine play status based on flags
    // Priority: completed > playing > planned > dropped
    let playStatus: GameStatus = null;
    if (data) {
      if (data.is_watched) {
        playStatus = "completed";
      } else if (data.is_planned && data.progress_minutes > 0) {
        playStatus = "playing";
      } else if (data.is_planned) {
        playStatus = "planned";
      } else if (data.progress_minutes > 0) {
        // Has progress but not planned/watched = dropped
        playStatus = "dropped";
      }
      // If progress_minutes === 0 and not planned/watched, no status (null)
    }

    return NextResponse.json({
      isFavorite,
      hasPlatinum: data?.has_platinum ?? false,
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
    const { igdbId, status, isFavorite, playtimeMinutes, hasPlatinum, gameData } = body;

    console.log("[game-status POST] Received:", { igdbId, status, isFavorite, playtimeMinutes, hasPlatinum, gameData });

    if (!igdbId) {
      console.log("[game-status POST] Missing igdbId");
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure igdbId is a number
    const numericIgdbId = typeof igdbId === 'number' ? igdbId : parseInt(igdbId);
    const mediaId = `igdb_${numericIgdbId}`;

    // Get existing record
    const { data: existing } = await userClient
      .from("user_media_tracking")
      .select("is_favorite, is_watched, is_planned, progress_minutes, has_platinum")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .single();

    // Handle "remove" status - delete the record
    if (status === "remove" || status === null) {
      if (existing) {
        await adminClient
          .from("user_media_tracking")
          .delete()
          .eq("user_id", user.id)
          .eq("media_id", mediaId);
      }
      return NextResponse.json({ success: true, isFavorite: false, playStatus: null });
    }

    // Build update object - only update fields that are explicitly provided
    const updateFields: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // Handle favorite update (independent of play status)
    if (isFavorite !== undefined) {
      updateFields.is_favorite = isFavorite;
    }

    // Handle play status update
    if (status !== undefined && status !== null) {
      // Clear any existing play status first
      updateFields.is_watched = false;
      updateFields.is_planned = false;
      
      switch (status) {
        case "completed":
          updateFields.is_watched = true;
          updateFields.progress_minutes = existing?.progress_minutes || 60;
          updateFields.updated_at = new Date().toISOString(); // Set completed date via updated_at
          break;
        case "playing":
          updateFields.is_planned = true;
          updateFields.progress_minutes = existing?.progress_minutes || 1;
          break;
        case "planned":
          updateFields.is_planned = true;
          updateFields.progress_minutes = 0; // Reset progress for planned
          break;
        case "dropped":
          // Keep existing progress
          break;
        case "favorite":
          // Just favorite, don't touch play status
          break;
      }
    }

    // Handle playtime update
    if (playtimeMinutes !== undefined && playtimeMinutes > 0) {
      if (existing?.progress_minutes && playtimeMinutes > 0) {
        // Add to existing
        updateFields.progress_minutes = existing.progress_minutes + playtimeMinutes;
      } else {
        updateFields.progress_minutes = playtimeMinutes;
      }
      // Also set playing status if not already set
      if (!existing?.is_planned && !existing?.is_watched) {
        updateFields.is_planned = true;
      }
    }

    // Handle platinum trophy update
    if (hasPlatinum !== undefined) {
      updateFields.has_platinum = hasPlatinum;
    }

    console.log("[game-status POST] Update fields:", updateFields);

    // Check if we need to upsert media first
    if (gameData && (Object.keys(updateFields).length > 1 || !existing)) {
      // Extract just the IGDB path portion
      let posterPath: string | null = null;
      if (gameData?.coverUrl) {
        posterPath = gameData.coverUrl.replace("https://images.igdb.com", "");
      }
      
      await adminClient
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
    }

    if (existing) {
      // Update existing record
      await adminClient
        .from("user_media_tracking")
        .update(updateFields)
        .eq("user_id", user.id)
        .eq("media_id", mediaId);
    } else {
      // Create new record with default values
      const newRecord = {
        user_id: user.id,
        media_id: mediaId,
        media_type: "game",
        is_favorite: updateFields.is_favorite ?? false,
        is_watched: updateFields.is_watched ?? false,
        is_planned: updateFields.is_planned ?? false,
        progress_minutes: updateFields.progress_minutes ?? 0,
        has_platinum: updateFields.has_platinum ?? false,
      };
      
      console.log("[game-status POST] Inserting new record:", newRecord);
      
      await adminClient
        .from("user_media_tracking")
        .insert(newRecord);
    }

    // Return the new state
    const newIsFavorite = updateFields.is_favorite ?? existing?.is_favorite ?? false;
    let newPlayStatus: GameStatus = null;
    if (updateFields.is_watched) {
      newPlayStatus = "completed";
    } else if (updateFields.is_planned) {
      newPlayStatus = updateFields.progress_minutes > (existing?.progress_minutes || 0) ? "playing" : "planned";
    } else if (updateFields.progress_minutes > 0 && existing?.progress_minutes === 0) {
      newPlayStatus = "dropped";
    } else if (existing?.is_planned) {
      newPlayStatus = "playing";
    }

    return NextResponse.json({ 
      success: true, 
      isFavorite: newIsFavorite,
      hasPlatinum: updateFields.has_platinum ?? existing?.has_platinum ?? false,
      playStatus: newPlayStatus,
      playtimeMinutes: updateFields.progress_minutes ?? existing?.progress_minutes ?? 0,
    });
  } catch (error) {
    console.error("[game-status POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update game status" },
      { status: 500 }
    );
  }
}
