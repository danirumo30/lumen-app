import type { Media, MediaProgressMinutes, MediaTypeForStats } from "@/modules/shared/domain/media";

export interface UserProfile {
  readonly id: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly username: string;
  readonly avatarUrl: string | null;
  readonly bannerUrl: string | null;
}

export interface Follower {
  readonly id: string;
  readonly username: string;
  readonly avatarUrl: string | null;
  readonly fullName?: string;
}

export interface UserProfileWithStats extends UserProfile {
  readonly totalMovieMinutes: MediaProgressMinutes;
  readonly totalTvMinutes: MediaProgressMinutes;
  readonly totalGameMinutes: MediaProgressMinutes;
  readonly totalMinutes: MediaProgressMinutes;
}

export interface UserProfileContentQuery {
  readonly userId: string;
  readonly includeFavorites: boolean;
  readonly includeWatched: boolean;
  readonly mediaTypes: MediaTypeForStats[];
}

export interface UserProfileWithContent extends UserProfileWithStats {
  readonly favoriteMovies: Media[];
  readonly watchedMovies: Media[];
  readonly favoriteTvShows: Media[];
  readonly watchedTvShows: Media[];
  readonly favoriteGames: Media[];
  readonly watchedGames: Media[];
  readonly followersCount: number;
  readonly followingCount: number;
  readonly isFollowing: boolean;
  readonly isFollower: boolean;
}

export interface UpdateProfileData {
  readonly avatarUrl?: string | null;
  readonly bannerUrl?: string | null;
  readonly username?: string;
}

