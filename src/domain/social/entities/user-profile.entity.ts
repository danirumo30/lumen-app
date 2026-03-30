import { Username } from "../../shared/value-objects/username.vo";
import { UserStats } from "../value-objects/user-stats";
import type { Media, MediaTypeForStats, MediaProgressMinutes } from "../../shared/value-objects/media-id";

export interface UserStatsData {
  readonly totalMovieMinutes: number;
  readonly totalTvMinutes: number;
  readonly totalGameMinutes: number;
  readonly totalMinutes: number;
  readonly totalEpisodesWatched: number;
  readonly totalMoviesWatched: number;
  readonly totalGamesPlayed: number;
  readonly totalGamesPlatinum: number;
}

export class UserProfile {
  public readonly id: string;
  // username exposed via getter as string
  public readonly firstName: string | null;
  public readonly lastName: string | null;
  public readonly avatarUrl: string | null;
  public readonly bannerUrl: string | null;
  public readonly stats: UserStats;
  public readonly followersCount: number;
  public readonly followingCount: number;
  public readonly isFollowing: boolean;
  public readonly isFollower: boolean;

  private _username: Username;
  get username(): string {
    return this._username.value;
  }

  // Expose stats fields directly for convenience and to satisfy UserProfileWithStats interface
  get totalMinutes(): MediaProgressMinutes { return this.stats.totalMinutes; }
  get totalTvMinutes(): MediaProgressMinutes { return this.stats.totalTvMinutes; }
  get totalMovieMinutes(): MediaProgressMinutes { return this.stats.totalMovieMinutes; }
  get totalGameMinutes(): MediaProgressMinutes { return this.stats.totalGameMinutes; }
  get totalEpisodesWatched(): number { return this.stats.totalEpisodesWatched; }
  get totalMoviesWatched(): number { return this.stats.totalMoviesWatched; }
  get totalGamesPlayed(): number { return this.stats.totalGamesPlayed; }
  get totalGamesPlatinum(): number { return this.stats.totalGamesPlatinum; }

  constructor(
    id: string,
    username: string,
    firstName: string | null,
    lastName: string | null,
    avatarUrl: string | null,
    bannerUrl: string | null,
    stats: UserStats,
    followersCount: number,
    followingCount: number,
    isFollowing: boolean,
    isFollower: boolean
  ) {
    this.id = id;
    this._username = new Username(username);
    this.firstName = firstName;
    this.lastName = lastName;
    this.avatarUrl = avatarUrl;
    this.bannerUrl = bannerUrl;
    this.stats = stats;
    this.followersCount = followersCount;
    this.followingCount = followingCount;
    this.isFollowing = isFollowing;
    this.isFollower = isFollower;
  }

  static fromDatabase(data: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    bannerUrl: string | null;
    stats: {
      totalMovieMinutes: number;
      totalTvMinutes: number;
      totalGameMinutes: number;
      totalMinutes: number;
      totalEpisodesWatched: number;
      totalMoviesWatched: number;
      totalGamesPlayed: number;
      totalGamesPlatinum: number;
    };
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
    isFollower: boolean;
  }): UserProfile {
    return new UserProfile(
      data.id,
      data.username,
      data.firstName,
      data.lastName,
      data.avatarUrl,
      data.bannerUrl,
      UserStats.fromData(data.stats),
      data.followersCount,
      data.followingCount,
      data.isFollowing,
      data.isFollower
    );
  }
}

// Mantener interfaces para compatibilidad
export interface UserProfileWithStats extends UserProfile {
  readonly totalMovieMinutes: number;
  readonly totalTvMinutes: number;
  readonly totalGameMinutes: number;
  readonly totalMinutes: number;
  readonly totalEpisodesWatched: number;
  readonly totalMoviesWatched: number;
  readonly totalGamesPlayed: number;
  readonly totalGamesPlatinum: number;
}

export interface UserProfileContentQuery {
  readonly userId: string;
  readonly includeFavorites: boolean;
  readonly includeWatched: boolean;
  mediaTypes: MediaTypeForStats[];
}

export interface UserProfileWithContent extends UserProfileWithStats {
  readonly favoriteMovies: Media[];
  readonly watchedMovies: Media[];
  readonly favoriteTvShows: Media[];
  readonly watchedTvShows: Media[];
  readonly favoriteGames: Media[];
  readonly watchedGames: Media[];
}

export interface UpdateProfileData {
  readonly avatarUrl?: string | null;
  readonly bannerUrl?: string | null;
  readonly username?: string;
}

export interface Follower {
  readonly id: string;
  readonly username: string;
  readonly avatarUrl: string | null;
  readonly fullName?: string;
}
