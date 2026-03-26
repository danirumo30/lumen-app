import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper to create authenticated client
function createAuthClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Get user's favorite status for a movie
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
      return NextResponse.json({ favorite: false });
    }

    const supabase = createAuthClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ favorite: false });
    }

    const { data, error } = await supabase
      .from("user_media_tracking")
      .select("is_favorite, created_at")
      .eq("user_id", user.id)
      .eq("media_id", `movie_${tmdbId}`)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      favorite: data?.is_favorite ?? false,
      favoritedAt: data?.created_at || null,
    });
  } catch (error) {
    console.error("Error fetching favorite status:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite status" },
      { status: 500 }
    );
  }
}

// Toggle favorite status
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tmdbId, favorite } = body;

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAuthClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mediaId = `movie_${tmdbId}`;

     if (favorite) {
       const { data: existing } = await supabase
         .from("user_media_tracking")
         .select("is_favorite, is_watched, is_planned, rating, progress_minutes")
         .eq("user_id", user.id)
         .eq("media_id", mediaId)
         .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_media_tracking")
          .update({ 
            is_favorite: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_media_tracking")
          .insert({
            user_id: user.id,
            media_id: mediaId,
            media_type: "movie",
            is_favorite: true,
            is_watched: false,
            is_planned: false,
          });

        if (error) throw error;
      }
     } else {
       const { data: existing } = await supabase
         .from("user_media_tracking")
         .select("is_watched, is_planned, rating, progress_minutes")
         .eq("user_id", user.id)
         .eq("media_id", mediaId)
         .maybeSingle();

       if (existing && (existing.is_watched || existing.is_planned || existing.rating || existing.progress_minutes)) {
        const { error } = await supabase
          .from("user_media_tracking")
          .update({ 
            is_favorite: false,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_media_tracking")
          .delete()
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    console.error("Error updating favorite status:", error);
    return NextResponse.json(
      { error: "Failed to update favorite status" },
      { status: 500 }
    );
  }
}
