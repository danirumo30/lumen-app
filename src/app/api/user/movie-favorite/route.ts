import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Helper to create authenticated client
function createAuthClient(token: string) {
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
    const { tmdbId, favorite, movieData } = body;

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userClient = createAuthClient(token);
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (!user || userError) {
      console.error("[movie-favorite POST] User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mediaId = `movie_${tmdbId}`;

    // Build mediaInsert object with available data or fetch from TMDB
    let title = movieData?.title || null;
    let originalTitle = movieData?.originalTitle || null;
    let releaseYear = movieData?.releaseYear || null;
    let releaseDate = movieData?.releaseDate || null;
    let runtime = movieData?.runtime || null;
    let posterPath = movieData?.posterPath 
      ? movieData.posterPath.replace("https://image.tmdb.org/t/p/w500", "")
      : null;

    // If title is missing, fetch minimum data from TMDB
    if (!title) {
      try {
        const response = await fetch(
          `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`
        );
        
        if (response.ok) {
          const movie = await response.json();
          title = movie.title || `Película ${tmdbId}`;
          originalTitle = originalTitle || movie.original_title;
          if (movie.release_date) {
            releaseYear = releaseYear || parseInt(movie.release_date.substring(0, 4));
            releaseDate = releaseDate || movie.release_date;
          }
          runtime = runtime || movie.runtime;
          posterPath = posterPath || (movie.poster_path ? movie.poster_path.replace(/^t\.*/, "") : null);
        } else {
          title = `Película ${tmdbId}`;
        }
      } catch (error) {
        console.error("[movie-favorite POST] TMDB fetch error:", error);
        title = `Película ${tmdbId}`;
      }
    }

    // Ensure title is not null/undefined
    if (!title) {
      title = `Película ${tmdbId}`;
    }

    // Construct final media object
    const mediaInsert = {
      id: mediaId,
      type: "movie",
      title,
      original_title: originalTitle,
      release_year: releaseYear,
      release_date: releaseDate,
      runtime_minutes: runtime,
      poster_path: posterPath,
    };

    // Upsert media record unconditionally
    const { error: mediaError } = await adminClient
      .from("media")
      .upsert(mediaInsert, {
        onConflict: "id",
      });

    if (mediaError) {
      console.error("[movie-favorite POST] Media upsert error:", mediaError);
    }

     // Get current state
     const { data: existing } = await userClient
       .from("user_media_tracking")
       .select("is_favorite, is_watched, is_planned, rating, progress_minutes")
       .eq("user_id", user.id)
       .eq("media_id", mediaId)
       .maybeSingle();

    if (favorite) {
      if (existing) {
        const { error } = await userClient
          .from("user_media_tracking")
          .update({ 
            is_favorite: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) throw error;
      } else {
        const { error } = await userClient
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
       if (existing && (existing.is_watched || existing.is_planned || existing.rating || existing.progress_minutes)) {
         const { error } = await userClient
           .from("user_media_tracking")
           .update({ 
             is_favorite: false,
             updated_at: new Date().toISOString(),
           })
           .eq("user_id", user.id)
           .eq("media_id", mediaId);

         if (error) throw error;
       } else if (existing) {
         const { error } = await userClient
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
    console.error("Error updating favorite status:", error);
    return NextResponse.json(
      { error: "Failed to update favorite status" },
      { status: 500 }
    );
  }
}
