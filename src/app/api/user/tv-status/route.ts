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

// Get user's watched status for a TV show
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
      return NextResponse.json({ watched: false, watchedAt: null });
    }

    const supabase = createUserClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ watched: false, watchedAt: null });
    }
    
    // Check user_media_tracking for watched status
    const { data, error } = await supabase
      .from("user_media_tracking")
      .select("is_watched, updated_at")
      .eq("user_id", user.id)
      .eq("media_id", `tv_${tmdbId}`)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[tv-status GET] Error:", error);
    }

    return NextResponse.json({
      watched: data?.is_watched ?? false,
      watchedAt: data?.updated_at || null,
    });
  } catch (error) {
    console.error("[tv-status GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV show status" },
      { status: 500 }
    );
  }
}

// Mark TV show as watched
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tmdbId, watched, tvData, totalMinutes } = body;

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
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
      console.error("[tv-status POST] User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mediaId = `tv_${tmdbId}`;

    // First, ensure the TV show exists in media table (admin to bypass RLS)
    if (watched && tvData) {
      const posterPath = tvData.posterPath 
        ? tvData.posterPath.replace("https://image.tmdb.org/t/p/w500", "")
        : null;

      const { error: mediaError } = await adminClient
        .from("media")
        .upsert({
          id: mediaId,
          type: "tv",
          title: tvData.title,
          original_title: tvData.originalTitle,
          release_year: tvData.releaseYear,
          release_date: tvData.firstAirDate,
          poster_path: posterPath,
        }, {
          onConflict: "id",
        });

      if (mediaError) {
        console.error("[tv-status POST] Media upsert error:", mediaError);
      }
    }

    // Get current state
    const { data: existing } = await userClient
      .from("user_media_tracking")
      .select("is_watched, is_favorite, is_planned, rating, progress_minutes")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
      .single();

    const wasWatched = existing?.is_watched ?? false;

    if (watched) {
      if (existing) {
        // Update existing record - set is_watched=true
        const { error } = await adminClient
          .from("user_media_tracking")
          .update({ 
            is_watched: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) {
          console.error("[tv-status POST] Update tracking error:", error);
          throw error;
        }
      } else {
        // Create new record
        const { error } = await adminClient
          .from("user_media_tracking")
          .insert({
            user_id: user.id,
            media_id: mediaId,
            media_type: "tv",
            is_watched: true,
            is_favorite: false,
            is_planned: false,
          });

        if (error) {
          console.error("[tv-status POST] Insert tracking error:", error);
          throw error;
        }
      }
    } else {
      // Remove watched status
      if (existing && (existing.is_favorite || existing.is_planned || existing.rating)) {
        // Keep record but remove watched
        const { error } = await adminClient
          .from("user_media_tracking")
          .update({ 
            is_watched: false,
            progress_minutes: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) throw error;
      } else {
        // Delete the record entirely
        const { error } = await adminClient
          .from("user_media_tracking")
          .delete()
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) throw error;
      }
    }

    // Update user_tv_progress for instant statistics if totalMinutes provided
    if (totalMinutes !== undefined && watched) {
      const { error: progressError } = await adminClient
        .from("user_tv_progress")
        .upsert({
          user_id: user.id,
          tv_tmdb_id: parseInt(tmdbId),
          total_minutes: totalMinutes,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,tv_tmdb_id",
        });
      
      if (progressError) {
        console.error("[tv-status] Failed to update TV progress:", progressError);
        // Non-critical error, don't fail the request
      }
    } else if (!watched) {
      // Remove from user_tv_progress if unmarking series
      await adminClient
        .from("user_tv_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("tv_tmdb_id", parseInt(tmdbId));
    }

    return NextResponse.json({ success: true, watched });
  } catch (error) {
    console.error("[tv-status POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update TV show status" },
      { status: 500 }
    );
  }
}
