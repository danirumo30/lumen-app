 import type { MediaProgressMinutes } from "../../shared/value-objects/media-id";

export interface UserStatsData {
  readonly totalMovieMinutes: MediaProgressMinutes;
  readonly totalTvMinutes: MediaProgressMinutes;
  readonly totalGameMinutes: MediaProgressMinutes;
  readonly totalMinutes: MediaProgressMinutes;
  readonly totalEpisodesWatched: number;
  readonly totalMoviesWatched: number;
  readonly totalGamesPlayed: number;
  readonly totalGamesPlatinum: number;
}

export class UserStats {
  readonly totalMovieMinutes: MediaProgressMinutes;
  readonly totalTvMinutes: MediaProgressMinutes;
  readonly totalGameMinutes: MediaProgressMinutes;
  readonly totalMinutes: MediaProgressMinutes;
  readonly totalEpisodesWatched: number;
  readonly totalMoviesWatched: number;
  readonly totalGamesPlayed: number;
  readonly totalGamesPlatinum: number;

  private constructor(data: UserStatsData) {
    this.totalMovieMinutes = data.totalMovieMinutes;
    this.totalTvMinutes = data.totalTvMinutes;
    this.totalGameMinutes = data.totalGameMinutes;
    this.totalMinutes = data.totalMinutes;
    this.totalEpisodesWatched = data.totalEpisodesWatched;
    this.totalMoviesWatched = data.totalMoviesWatched;
    this.totalGamesPlayed = data.totalGamesPlayed;
    this.totalGamesPlatinum = data.totalGamesPlatinum;
  }

  static fromData(data: UserStatsData): UserStats {
    return new UserStats(data);
  }

  equals(other: UserStats): boolean {
    return this.totalMovieMinutes === other.totalMovieMinutes &&
           this.totalTvMinutes === other.totalTvMinutes &&
           this.totalGameMinutes === other.totalGameMinutes &&
           this.totalMinutes === other.totalMinutes &&
           this.totalEpisodesWatched === other.totalEpisodesWatched &&
           this.totalMoviesWatched === other.totalMoviesWatched &&
           this.totalGamesPlayed === other.totalGamesPlayed &&
           this.totalGamesPlatinum === other.totalGamesPlatinum;
  }
}
