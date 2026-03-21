import type { SupabaseClient } from "@supabase/supabase-js";

import type { Media, MediaTypeForStats } from "@/modules/shared/domain/media";
import type { UserProfileRepository } from "@/modules/social/domain/user-profile.repository";
import type {
  UpdateProfileData,
  UserProfile,
  UserProfileContentQuery,
  UserProfileWithContent,
  UserProfileWithStats,
} from "@/modules/social/domain/user-profile";

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * Extract TMDB ID from media ID (e.g., "movie_1159559" -> "1159559")
 */
function extractTmdbId(mediaId: string): string | null {
  const match = mediaId.match(/^(movie_|tmdb_)(\d+)$/);
  return match ? match[2] : null;
}

/**
 * Fetch movie poster path from TMDB and update the media record in DB
 */
async function fetchAndUpdatePosterPath(
  client: SupabaseClient,
  mediaId: string,
  tmdbId: string,
): Promise<string | undefined> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&language=es-ES`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      console.error(`[fetchPoster] TMDB error for ${tmdbId}:`, response.status);
      return undefined;
    }

    const movie = await response.json();

    if (movie.poster_path) {
      // Update the media record with the poster_path
      await client
        .from("media")
        .update({ poster_path: movie.poster_path })
        .eq("id", mediaId);

      console.log(`[fetchPoster] Updated poster for ${mediaId}: ${movie.poster_path}`);
      return movie.poster_path;
    }

    return undefined;
  } catch (error) {
    console.error(`[fetchPoster] Error fetching poster for ${tmdbId}:`, error);
    return undefined;
  }
}

interface UserProfileRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserGlobalStatsRow {
  user_id: string;
  total_movie_minutes: number;
  total_tv_minutes: number;
  total_game_minutes: number;
  total_minutes: number;
}

interface MediaRow {
  id: string;
  type: string;
  title: string;
  original_title?: string;
  release_year?: number;
  runtime_minutes?: number;
  poster_path?: string;
  release_date?: string;
}

export class SupabaseUserProfileRepository implements UserProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getProfileById(userId: string): Promise<UserProfileWithStats | null> {
    const { data: profileData, error: profileError } = await this.client
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle<UserProfileRow>();

    if (profileError) {
      throw profileError;
    }

    if (!profileData) {
      return null;
    }

    const { data: statsData, error: statsError } = await this.client
      .from("user_global_stats")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle<UserGlobalStatsRow>();

    if (statsError) {
      throw statsError;
    }

    return this.toProfileWithStats(profileData, statsData);
  }

  async getProfileByUsername(username: string): Promise<UserProfileWithStats | null> {
    const { data: profileData, error: profileError } = await this.client
      .from("user_profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle<UserProfileRow>();

    if (profileError) {
      throw profileError;
    }

    if (!profileData) {
      return null;
    }

    const { data: statsData, error: statsError } = await this.client
      .from("user_global_stats")
      .select("*")
      .eq("user_id", profileData.id)
      .maybeSingle<UserGlobalStatsRow>();

    if (statsError) {
      throw statsError;
    }

    return this.toProfileWithStats(profileData, statsData);
  }

  async getProfileContent(query: UserProfileContentQuery): Promise<UserProfileWithContent> {
    const profile = await this.getProfileById(query.userId);
    if (!profile) {
      throw new Error("Profile not found");
    }

    // Fetch user media tracking data
    // IMPORTANT: Exclude individual episodes (tv_{tmdbId}_s{season}_e{episode}) from the start
    // Only fetch series, movies, and games - NOT episode-level records
    let mediaQuery = this.client
      .from("user_media_tracking")
      .select("media_id, media_type, is_favorite, is_watched")
      .eq("user_id", query.userId)
      .not("media_id", "like", "%_s%_e%")  // Exclude episodes like tv_123_s1_e5
      .limit(10000);

    if (query.mediaTypes.length > 0) {
      mediaQuery = mediaQuery.in("media_type", query.mediaTypes);
    }

    const { data: trackingData, error: trackingError } = await mediaQuery;

    console.log("[getProfileContent] user_id:", query.userId, "trackingData count:", trackingData?.length);
    console.log("[getProfileContent] trackingError:", trackingError);

    if (trackingError) {
      throw trackingError;
    }

    // Group media by type and status
    const allMediaIds = new Set<string>();
    const favoriteMovies: Media[] = [];
    const watchedMovies: Media[] = [];
    const favoriteTvShows: Media[] = [];
    const watchedTvShows: Media[] = [];
    const favoriteGames: Media[] = [];
    const watchedGames: Media[] = [];

    if (trackingData) {
      trackingData.forEach((row) => {
        allMediaIds.add(row.media_id);
      });

      // Filter out episode IDs (tv_{tmdbId}_s{season}_e{episode})
      const mediaIds = new Set<string>();
      for (const id of allMediaIds) {
        if (!/^tv_\d+_s\d+_e\d+$/.test(id)) {
          mediaIds.add(id);
        }
      }

      console.log("[getProfileContent] filtered mediaIds count:", mediaIds.size);

      // Fetch media details only for non-episode IDs
      if (mediaIds.size > 0) {
        const { data: mediaData, error: mediaError } = await this.client
          .from("media")
          .select("*")
          .in("id", Array.from(mediaIds));

        console.log("[getProfileContent] mediaData:", mediaData);
        console.log("[getProfileContent] mediaError:", mediaError);

        if (mediaError) {
          throw mediaError;
        }

        const mediaMap = new Map<string, Media>();
        if (mediaData) {
          // Find media items missing poster_path
          const missingPosters = mediaData.filter((m: MediaRow) => !m.poster_path && m.type === "movie");
          
          // Fetch missing posters from TMDB
          await Promise.all(
            missingPosters.map(async (media: MediaRow) => {
              const tmdbId = extractTmdbId(media.id);
              if (tmdbId) {
                const posterPath = await fetchAndUpdatePosterPath(this.client, media.id, tmdbId);
                if (posterPath) {
                  // Update local reference for the mediaMap
                  media.poster_path = posterPath;
                }
              }
            })
          );

          mediaData.forEach((mediaRow: MediaRow) => {
            const posterUrl = mediaRow.poster_path
              ? `https://image.tmdb.org/t/p/w500${mediaRow.poster_path}`
              : undefined;
            console.log("[getProfileContent] mediaRow:", { id: mediaRow.id, poster_path: mediaRow.poster_path, posterUrl });
            
            mediaMap.set(mediaRow.id, {
              id: mediaRow.id as Media["id"],
              type: mediaRow.type as "movie" | "tv",
              title: mediaRow.title,
              originalTitle: mediaRow.original_title,
              releaseYear: mediaRow.release_year,
              releaseDate: mediaRow.release_date,
              runtimeMinutes: mediaRow.runtime_minutes,
              posterUrl,
            });
          });
        }

        console.log("[getProfileContent] mediaMap:", Array.from(mediaMap.entries()));

        // Distribute media based on tracking data
        trackingData.forEach((row) => {
          const media = mediaMap.get(row.media_id);
          console.log("[getProfileContent] row.media_id:", row.media_id, "media:", media, "is_watched:", row.is_watched);
          if (!media) return;

          // Skip episode entries (media_id like tv_{tmdbId}_s{season}_e{episode})
          const isEpisode = /^tv_\d+_s\d+_e\d+$/.test(row.media_id);
          if (isEpisode) {
            // Skip episodes, only include series, movies, games
            return;
          }

          const isFavorite = query.includeFavorites && row.is_favorite;
          const isWatched = query.includeWatched && row.is_watched;

          if (isFavorite) {
            switch (row.media_type) {
              case "movie":
                favoriteMovies.push(media);
                break;
              case "tv":
                favoriteTvShows.push(media);
                break;
              case "game":
                favoriteGames.push(media);
                break;
            }
          }

          if (isWatched) {
            switch (row.media_type) {
              case "movie":
                watchedMovies.push(media);
                break;
              case "tv":
                watchedTvShows.push(media);
                break;
              case "game":
                watchedGames.push(media);
                break;
            }
          }
        });
      }
    }

    return {
      ...profile,
      favoriteMovies,
      watchedMovies,
      favoriteTvShows,
      watchedTvShows,
      favoriteGames,
      watchedGames,
      followersCount: 0, // TODO: Implementar
      followingCount: 0, // TODO: Implementar
      isFollowing: false, // TODO: Implementar
      isFollower: false, // TODO: Implementar
    };
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    const updateData: Partial<UserProfileRow> = {};

    if (data.avatarUrl !== undefined) {
      updateData.avatar_url = data.avatarUrl;
    }

    if (data.bannerUrl !== undefined) {
      updateData.banner_url = data.bannerUrl;
    }

    if (data.username !== undefined) {
      updateData.username = data.username;
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedData, error } = await this.client
      .from("user_profiles")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single<UserProfileRow>();

    if (error) {
      throw error;
    }

    return this.toUserProfile(updatedData);
  }

  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    let query = this.client
      .from("user_profiles")
      .select("id")
      .eq("username", username);

    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw error;
    }

    return !data;
  }

  async searchUsers(query: string, limit: number = 20): Promise<UserProfile[]> {
    const { data, error } = await this.client
      .from("user_profiles")
      .select("*")
      .ilike("username", `%${query}%`)
      .limit(limit);

    if (error) {
      throw error;
    }

    return data.map(this.toUserProfile);
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await this.client
      .from("user_followers")
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });

    if (error) {
      throw error;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await this.client
      .from("user_followers")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);

    if (error) {
      throw error;
    }
  }

  async getFollowers(userId: string, limit: number = 20): Promise<UserProfile[]> {
    const { data: followerIds, error } = await this.client
      .from("user_followers")
      .select("follower_id")
      .eq("following_id", userId)
      .limit(limit);

    if (error || !followerIds?.length) return [];

    const ids = followerIds.map(item => item.follower_id);
    return this.getProfilesByIds(ids);
  }

  async getFollowing(userId: string, limit: number = 20): Promise<UserProfile[]> {
    const { data: followingIds, error } = await this.client
      .from("user_followers")
      .select("following_id")
      .eq("follower_id", userId)
      .limit(limit);

    if (error || !followingIds?.length) return [];

    const ids = followingIds.map(item => item.following_id);
    return this.getProfilesByIds(ids);
  }

  private async getProfilesByIds(ids: string[]): Promise<UserProfile[]> {
    if (!ids.length) return [];
    
    const { data, error } = await this.client
      .from("user_profiles")
      .select("*")
      .in("id", ids);

    if (error) throw error;
    return data.map(this.toUserProfile);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await this.client
      .rpc("is_following", { follower: followerId, following: followingId });

    if (error) {
      throw error;
    }

    return data;
  }

  async getFollowersCount(userId: string): Promise<number> {
    const { data, error } = await this.client
      .rpc("get_follower_count", { user_id: userId });

    if (error) {
      throw error;
    }

    return data || 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const { data, error } = await this.client
      .rpc("get_following_count", { user_id: userId });

    if (error) {
      throw error;
    }

    return data || 0;
  }

  private toUserProfile(row: UserProfileRow): UserProfile {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      username: row.username,
      avatarUrl: row.avatar_url,
      bannerUrl: row.banner_url,
    };
  }

  private toProfileWithStats(
    profileRow: UserProfileRow,
    statsRow: UserGlobalStatsRow | null,
  ): UserProfileWithStats {
    return {
      ...this.toUserProfile(profileRow),
      totalMovieMinutes: statsRow?.total_movie_minutes ?? 0,
      totalTvMinutes: statsRow?.total_tv_minutes ?? 0,
      totalGameMinutes: statsRow?.total_game_minutes ?? 0,
      totalMinutes: statsRow?.total_minutes ?? 0,
    };
  }
}
