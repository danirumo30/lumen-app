import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function createUserClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get("tmdbId");
    
    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

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
    
    const { data, error } = await supabase
      .from("user_media_tracking")
      .select("is_watched, updated_at")
      .eq("user_id", user.id)
      .eq("media_id", `movie_${tmdbId}`)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("[movie-status GET] Error:", error);
    }

    return NextResponse.json({
      watched: data?.is_watched ?? false,
      watchedAt: data?.updated_at || null,
    });
  } catch (error) {
    logger.error("[movie-status GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch movie status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tmdbId, watched, movieData } = body;

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userClient = createUserClient(token);
    
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (!user || userError) {
      logger.error("[movie-status POST] User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mediaId = `movie_${tmdbId}`;
    const movieMinutes = (movieData?.runtime || 90);

    
    if (watched && movieData) {
      
      const posterPath = movieData.posterPath 
        ? movieData.posterPath.replace("https://image.tmdb.org/t/p/w500", "")
        : null;

      const { error: mediaError } = await adminClient
        .from("media")
        .upsert({
          id: mediaId,
          type: "movie",
          title: movieData.title,
          original_title: movieData.originalTitle,
          release_year: movieData.releaseYear,
          release_date: movieData.releaseDate,
          runtime_minutes: movieData.runtime,
          poster_path: posterPath,
        }, {
          onConflict: "id",
        });

      if (mediaError) {
        logger.error("[movie-status POST] Media upsert error:", mediaError);
      }
    }

    const { data: existing } = await userClient
      .from("user_media_tracking")
      .select("is_watched, is_favorite, is_planned, rating, progress_minutes")
      .eq("user_id", user.id)
      .eq("media_id", mediaId)
       .single();

     if (watched) {
      if (existing) {
        const { error } = await adminClient
          .from("user_media_tracking")
          .update({ 
            is_watched: true,
            progress_minutes: movieMinutes, 
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) {
          logger.error("[movie-status POST] Update tracking error:", error);
          throw error;
        }
      } else {
        const { error } = await adminClient
          .from("user_media_tracking")
          .insert({
            user_id: user.id,
            media_id: mediaId,
            media_type: "movie",
            is_watched: true,
            is_favorite: false,
            is_planned: false,
            progress_minutes: movieMinutes, 
          });

        if (error) {
          logger.error("[movie-status POST] Insert tracking error:", error);
          throw error;
        }
      }
    } else {
      if (existing && (existing.is_favorite || existing.is_planned || existing.rating)) {
        
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
        const { error } = await adminClient
          .from("user_media_tracking")
          .delete()
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) throw error;
      }
    }

    return NextResponse.json({ success: true, watched });
  } catch (error) {
    logger.error("[movie-status POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update movie status" },
      { status: 500 }
    );
  }
}

