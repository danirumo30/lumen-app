import { logger } from '@/lib/logger';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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
      return NextResponse.json({ favorite: false, favoritedAt: null });
    }

    const supabase = createUserClient(token);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ favorite: false, favoritedAt: null });
    }
    
    const { data, error } = await supabase
      .from("user_media_tracking")
      .select("is_favorite, updated_at")
      .eq("user_id", user.id)
      .eq("media_id", `tv_${tmdbId}`)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error("[tv-favorite GET] Error:", error);
    }

    return NextResponse.json({
      favorite: data?.is_favorite ?? false,
      favoritedAt: data?.updated_at || null,
    });
  } catch (error) {
    logger.error("[tv-favorite GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch TV show favorite status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tmdbId, favorite, tvData } = body;

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId required" }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userClient = createUserClient(token);
    // Admin client for writing (bypasses RLS)
    const adminClient = createAdminClient();

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (!user || userError) {
      logger.error("[tv-favorite POST] User error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mediaId = `tv_${tmdbId}`;

    let title = tvData?.title || null;
    let originalTitle = tvData?.originalTitle || null;
    let releaseYear = tvData?.releaseYear || null;
    let releaseDate = tvData?.firstAirDate || null;
    let runtime = tvData?.episodeRunTime || null;
    let posterPath = tvData?.posterPath 
      ? tvData.posterPath.replace("https://image.tmdb.org/t/p/w500", "")
      : null;

    if (!title) {
      try {
        const response = await fetch(
          `${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`
        );
        
        if (response.ok) {
          const tv = await response.json();
          title = tv.name || `Serie ${tmdbId}`;
          originalTitle = originalTitle || tv.original_name;
          if (tv.first_air_date) {
            releaseYear = releaseYear || parseInt(tv.first_air_date.substring(0, 4));
            releaseDate = releaseDate || tv.first_air_date;
          }
          // episode_run_time is an array, take first if available
          runtime = runtime || (tv.episode_run_time && tv.episode_run_time[0]) || null;
          posterPath = posterPath || (tv.poster_path ? tv.poster_path.replace(/^t\.*/, "") : null);
        } else {
          title = `Serie ${tmdbId}`;
        }
      } catch (error) {
        logger.error("[tv-favorite POST] TMDB fetch error:", error);
        title = `Serie ${tmdbId}`;
      }
    }

    // Ensure title is not null/undefined
    if (!title) {
      title = `Serie ${tmdbId}`;
    }

    const mediaInsert = {
      id: mediaId,
      type: "tv",
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
      logger.error("[tv-favorite POST] Media upsert error:", mediaError);
    }

     const { data: existing } = await userClient
       .from("user_media_tracking")
       .select("is_watched, is_favorite, is_planned, rating, progress_minutes")
       .eq("user_id", user.id)
       .eq("media_id", mediaId)
       .maybeSingle();

    if (favorite) {
      if (existing) {
        const { error } = await adminClient
          .from("user_media_tracking")
          .update({ 
            is_favorite: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("media_id", mediaId);

        if (error) {
          logger.error("[tv-favorite POST] Update tracking error:", error);
          throw error;
        }
      } else {
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
          logger.error("[tv-favorite POST] Insert tracking error:", error);
          throw error;
        }
      }
     } else {
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
    logger.error("[tv-favorite POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to update TV show favorite status" },
      { status: 500 }
    );
  }
}

