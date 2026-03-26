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

// Get user's favorite status for a TV show
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
      return NextResponse.json({ favorite: false, favoritedAt: null });
    }

    const supabase = createUserClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ favorite: false, favoritedAt: null });
    }
    
    // Check user_media_tracking for favorite status
    const { data, error } = await supabase
      .from("user_media_tracking")
      .select("is_favorite, updated_at")
      .eq("user_id", user.id)
      .eq("media_id", `tv_${tmdbId}`)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[tv-favorite GET] Error:", error);
    }

    return NextResponse.json({
      favorite: data?.is_favorite ?? false,
      favoritedAt: data?.updated_at || null,
    });
  } catch (error) {
    console.error("[tv-favorite GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV show favorite status" },
      { status: 500 }
    );
  }
}

// Mark TV show as favorite
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

    // User client for reading
    const userClient = createUserClient(token);
    // Admin client for writing (bypasses RLS)
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (!user || userError) {
      console.error("[tv-favorite POST] User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mediaId = `tv_${tmdbId}`;

     // Get current state
     const { data: existing } = await userClient
       .from("user_media_tracking")
       .select("is_watched, is_favorite, is_planned, rating, progress_minutes")
       .eq("user_id", user.id)
       .eq("media_id", mediaId)
       .maybeSingle();

    if (favorite) {
      if (existing) {
        // Update existing record - set is_favorite=true
        const { error } = await adminClient
          .from("user_media_tracking")
          .update({ 
            is_favorite: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) {
          console.error("[tv-favorite POST] Update tracking error:", error);
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
            is_watched: false,
            is_favorite: true,
            is_planned: false,
          });

        if (error) {
          console.error("[tv-favorite POST] Insert tracking error:", error);
          throw error;
        }
      }
     } else {
       // Remove favorite status
       if (existing && (existing.is_watched || existing.is_planned || existing.rating)) {
         // Keep record but remove favorite
         const { error } = await adminClient
           .from("user_media_tracking")
           .update({ 
             is_favorite: false,
             updated_at: new Date().toISOString(),
           })
           .eq("user_id", user.id)
           .eq("media_id", mediaId);

         if (error) throw error;
       } else if (existing) {
         // No other data, delete the record
         const { error } = await adminClient
           .from("user_media_tracking")
           .delete()
           .eq("user_id", user.id)
           .eq("media_id", mediaId);

         if (error) throw error;
       } else {
         // No existing record, success no-op
       }
     }

    return NextResponse.json({ success: true, favorite });
  } catch (error) {
    console.error("[tv-favorite POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update TV show favorite status" },
      { status: 500 }
    );
  }
}
