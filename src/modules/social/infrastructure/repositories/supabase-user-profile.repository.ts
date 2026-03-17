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
    let mediaQuery = this.client
      .from("user_media_tracking")
      .select("media_id, media_type, is_favorite, is_watched")
      .eq("user_id", query.userId);

    if (query.mediaTypes.length > 0) {
      mediaQuery = mediaQuery.in("media_type", query.mediaTypes);
    }

    const { data: trackingData, error: trackingError } = await mediaQuery;

    if (trackingError) {
      throw trackingError;
    }

    // Group media by type and status
    const mediaIds = new Set<string>();
    const favoriteMovies: Media[] = [];
    const watchedMovies: Media[] = [];
    const favoriteTvShows: Media[] = [];
    const watchedTvShows: Media[] = [];
    const favoriteGames: Media[] = [];
    const watchedGames: Media[] = [];

    if (trackingData) {
      trackingData.forEach((row) => {
        mediaIds.add(row.media_id);
      });

      // Fetch media details
      if (mediaIds.size > 0) {
        const { data: mediaData, error: mediaError } = await this.client
          .from("media")
          .select("*")
          .in("id", Array.from(mediaIds));

        if (mediaError) {
          throw mediaError;
        }

        const mediaMap = new Map<string, Media>();
        if (mediaData) {
          mediaData.forEach((mediaRow: MediaRow) => {
            mediaMap.set(mediaRow.id, {
              id: mediaRow.id as Media["id"],
              type: mediaRow.type as "movie" | "tv",
              title: mediaRow.title,
              originalTitle: mediaRow.original_title,
              releaseYear: mediaRow.release_year,
              runtimeMinutes: mediaRow.runtime_minutes,
            });
          });
        }

        // Distribute media based on tracking data
        trackingData.forEach((row) => {
          const media = mediaMap.get(row.media_id);
          if (!media) return;

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
    // Obtener IDs de seguidores
    const { data: followerIds, error: idsError } = await this.client
      .from("user_followers")
      .select("follower_id")
      .eq("following_id", userId)
      .limit(limit);

    if (idsError) {
      console.error("Error getting follower IDs:", idsError);
      throw idsError;
    }

    if (!followerIds || followerIds.length === 0) {
      return [];
    }

    // Obtener perfiles de los seguidores
    const ids = followerIds.map((item: any) => item.follower_id);
    const { data, error } = await this.client
      .from("user_profiles")
      .select("*")
      .in("id", ids);

    if (error) {
      console.error("Error getting followers profiles:", error);
      throw error;
    }

    return data.map(this.toUserProfile);
  }

  async getFollowing(userId: string, limit: number = 20): Promise<UserProfile[]> {
    // Obtener IDs de seguidos
    const { data: followingIds, error: idsError } = await this.client
      .from("user_followers")
      .select("following_id")
      .eq("follower_id", userId)
      .limit(limit);

    if (idsError) {
      console.error("Error getting following IDs:", idsError);
      throw idsError;
    }

    if (!followingIds || followingIds.length === 0) {
      return [];
    }

    // Obtener perfiles de los seguidos
    const ids = followingIds.map((item: any) => item.following_id);
    const { data, error } = await this.client
      .from("user_profiles")
      .select("*")
      .in("id", ids);

    if (error) {
      console.error("Error getting following profiles:", error);
      throw error;
    }

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
