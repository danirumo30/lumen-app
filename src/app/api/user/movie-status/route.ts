import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";

// Get user's watched status for a movie
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get("tmdbId");
    
    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ watched: false, watchedAt: null });
    }

    const { data, error } = await supabase
      .from("watched_media")
      .select("watched_at")
      .eq("user_id", user.id)
      .eq("tmdb_id", parseInt(tmdbId))
      .eq("media_type", "movie")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return NextResponse.json({
      watched: !!data,
      watchedAt: data?.watched_at || null,
    });
  } catch (error) {
    console.error("Error fetching movie status:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie status" },
      { status: 500 }
    );
  }
}

// Mark movie as watched
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tmdbId, watched } = body;

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (watched) {
      // Mark as watched
      const { error } = await supabase
        .from("watched_media")
        .upsert({
          user_id: user.id,
          tmdb_id: parseInt(tmdbId),
          media_type: "movie",
          watched_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,tmdb_id,media_type",
        });

      if (error) throw error;
    } else {
      // Remove watched status
      const { error } = await supabase
        .from("watched_media")
        .delete()
        .eq("user_id", user.id)
        .eq("tmdb_id", parseInt(tmdbId))
        .eq("media_type", "movie");

      if (error) throw error;
    }

    return NextResponse.json({ success: true, watched });
  } catch (error) {
    console.error("Error updating movie status:", error);
    return NextResponse.json(
      { error: "Failed to update movie status" },
      { status: 500 }
    );
  }
}
