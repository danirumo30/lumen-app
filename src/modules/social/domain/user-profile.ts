import type { MediaProgressMinutes } from "@/modules/shared/domain/media";

export interface UserProfile {
  readonly id: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly username: string;
  readonly avatarUrl: string | null;
  readonly bannerUrl: string | null;
}

export interface UserProfileWithStats extends UserProfile {
  readonly totalMovieMinutes: MediaProgressMinutes;
  readonly totalTvMinutes: MediaProgressMinutes;
  readonly totalGameMinutes: MediaProgressMinutes;
  readonly totalMinutes: MediaProgressMinutes;
}

