import type { SupabaseClient } from "@supabase/supabase-js";

import type { Media } from '@/domain/shared/value-objects/media-id';
import { MediaId } from '@/domain/shared/value-objects/media-id';
import { UserProfile, type UserStatsData } from '@/domain/social/entities/user-profile.entity';
import type { UserProfileRepository } from '@/domain/social/repository/user-profile.port';
import type {
  UpdateProfileData,
  UserProfileContentQuery,
  UserProfileWithContent,
  UserProfileWithStats,
} from '@/domain/social/entities/user-profile.entity';

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
  total_episodes_watched: number;
  total_movies_watched: number;
  total_games_played: number;
  total_games_platinum: number;
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
      .ilike("username", username)
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

    
    let mediaQuery = this.client
      .from("user_media_tracking")
      .select("media_id, media_type, is_favorite, is_watched, is_planned, progress_minutes")
      .eq("user_id", query.userId)
      .not("media_id", "like", "%_s%_e%")  
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

      const mediaIds = new Set<string>();
      for (const id of allMediaIds) {
        if (!/^tv_\d+_s\d+_e\d+$/.test(id)) {
          mediaIds.add(id);
        }
      }

      console.log("[getProfileContent] filtered mediaIds count:", mediaIds.size);

      if (mediaIds.size > 0) {
        const { data: mediaRows, error: mediaError } = await this.client
          .from("media")
          .select("*")
          .in("id", Array.from(mediaIds));

        if (mediaError) {
          throw mediaError;
        }

        console.log("[getProfileContent] mediaRows:", mediaRows?.length);

        const mediaMap = new Map<string, Media>();

         if (mediaRows) {
           for (const mediaRow of mediaRows) {
             let mediaId: MediaId;
             try {
               mediaId = MediaId.fromString(mediaRow.id);
            } catch (e) {
              console.warn(`[getProfileContent] Invalid media id skipped: ${mediaRow.id}`, e);
              continue;
            }

              let posterUrl: string | undefined;
              if (mediaRow.poster_path) {
                if (mediaRow.type === 'game') {
                  // IGDB images
                  posterUrl = `https://images.igdb.com${mediaRow.poster_path}`;
                } else {
                  // TMDB images (movie, tv)
                  posterUrl = `https://image.tmdb.org/t/p/w200${mediaRow.poster_path}`;
                }
              }

             console.log("[getProfileContent] mediaRow:", { id: mediaRow.id, poster_path: mediaRow.poster_path, posterUrl, type: mediaRow.type });

             mediaMap.set(mediaRow.id, {
               id: mediaId,
               type: mediaRow.type as "movie" | "tv" | "game",
               title: mediaRow.title,
               originalTitle: mediaRow.original_title,
               releaseYear: mediaRow.release_year,
               releaseDate: mediaRow.release_date,
               runtimeMinutes: mediaRow.runtime_minutes,
               posterUrl,
             });
           }
         }

        console.log("[getProfileContent] mediaMap:", Array.from(mediaMap.entries()));

        
        trackingData.forEach((row) => {
          const media = mediaMap.get(row.media_id);
          console.log("[getProfileContent] row.media_id:", row.media_id, "media:", media, "is_watched:", row.is_watched);
          if (!media) return;

          
          const isEpisode = /^tv_\d+_s\d+_e\d+$/.test(row.media_id);
          if (isEpisode) {
            
            return;
          }

          const isFavorite = query.includeFavorites && row.is_favorite;
          const isWatched = query.includeWatched && row.is_watched;
          
          const isPlayedOrPlanned = row.media_type === "game" && (
            row.progress_minutes > 0 || row.is_planned
          );

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

          if (row.media_type === "game") {
            if (row.is_watched || isPlayedOrPlanned) {
              watchedGames.push(media);
            }
          } else if (isWatched) {
            switch (row.media_type) {
              case "movie":
                watchedMovies.push(media);
                break;
              case "tv":
                watchedTvShows.push(media);
                break;
            }
          }
        });
      }
    }

      // Mutate the existing UserProfile instance by adding content arrays directly.
      // This preserves the private _username field and getters.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profile as any).favoriteMovies = favoriteMovies;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profile as any).watchedMovies = watchedMovies;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profile as any).favoriteTvShows = favoriteTvShows;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profile as any).watchedTvShows = watchedTvShows;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profile as any).favoriteGames = favoriteGames;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (profile as any).watchedGames = watchedGames;

      return profile as UserProfileWithContent;
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

    const { data: updatedData, error } = await this.client
      .from("user_profiles")
      .update(updateData)
      .eq("id", userId)
      .select("*")
      .maybeSingle<UserProfileRow>();

    if (error) {
      throw error;
    }

    if (!updatedData) {
      throw new Error("Failed to update profile");
    }

    return this.toUserProfile(updatedData);
  }

  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    let query = this.client
      .from("user_profiles")
      .select("id")
      .ilike("username", username)
      .limit(1);

    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data.length === 0;
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

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("user_followers")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .limit(1);

    if (error) throw error;
    return data.length > 0;
  }

  async getFollowersCount(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from("user_followers")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    if (error) throw error;
    return count || 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from("user_followers")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    if (error) throw error;
    return count || 0;
  }

  private toUserProfile(row: UserProfileRow): UserProfile {
    return UserProfile.fromDatabase({
      id: row.id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
      bannerUrl: row.banner_url,
      stats: {
        totalMovieMinutes: 0,
        totalTvMinutes: 0,
        totalGameMinutes: 0,
        totalMinutes: 0,
        totalEpisodesWatched: 0,
        totalMoviesWatched: 0,
        totalGamesPlayed: 0,
        totalGamesPlatinum: 0,
      },
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
      isFollower: false,
    });
  }

  private toProfileWithStats(
    profileRow: UserProfileRow,
    statsRow: UserGlobalStatsRow | null,
  ): UserProfileWithStats {
    const statsData: UserStatsData = {
      totalMovieMinutes: statsRow?.total_movie_minutes ?? 0,
      totalTvMinutes: statsRow?.total_tv_minutes ?? 0,
      totalGameMinutes: statsRow?.total_game_minutes ?? 0,
      totalMinutes: statsRow?.total_minutes ?? 0,
      totalEpisodesWatched: statsRow?.total_episodes_watched ?? 0,
      totalMoviesWatched: statsRow?.total_movies_watched ?? 0,
      totalGamesPlayed: statsRow?.total_games_played ?? 0,
      totalGamesPlatinum: statsRow?.total_games_platinum ?? 0,
    };

    return UserProfile.fromDatabase({
      id: profileRow.id,
      username: profileRow.username,
      firstName: profileRow.first_name,
      lastName: profileRow.last_name,
      avatarUrl: profileRow.avatar_url,
      bannerUrl: profileRow.banner_url,
      stats: statsData,
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
      isFollower: false,
    }) as UserProfileWithStats;
  }

  private async getProfilesByIds(ids: string[]): Promise<UserProfile[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.client
      .from("user_profiles")
      .select("*")
      .in("id", ids);

    if (error) throw error;
    if (!data) return [];

    return data.map(this.toUserProfile);
  }
}
