export class WatchedEpisode {
  public readonly tmdbId: number;
  public readonly seasonNumber: number;
  public readonly episodeNumber: number;

  constructor(tmdbId: number, seasonNumber: number, episodeNumber: number) {
    if (tmdbId <= 0) {
      throw new Error(`Invalid tmdbId: ${tmdbId}. Must be positive.`);
    }
    if (seasonNumber <= 0) {
      throw new Error(`Invalid seasonNumber: ${seasonNumber}. Must be positive.`);
    }
    if (episodeNumber <= 0) {
      throw new Error(`Invalid episodeNumber: ${episodeNumber}. Must be positive.`);
    }
    this.tmdbId = tmdbId;
    this.seasonNumber = seasonNumber;
    this.episodeNumber = episodeNumber;
  }

  static fromMediaId(mediaId: string): WatchedEpisode | null {
    const match = mediaId.match(/^tv_(\d+)_s(\d+)_e(\d+)$/);
    if (!match) return null;

    return new WatchedEpisode(
      parseInt(match[1], 10),
      parseInt(match[2], 10),
      parseInt(match[3], 10)
    );
  }

  toMediaId(): string {
    return `tv_${this.tmdbId}_s${this.seasonNumber}_e${this.episodeNumber}`;
  }

  equals(other: WatchedEpisode): boolean {
    return this.tmdbId === other.tmdbId &&
           this.seasonNumber === other.seasonNumber &&
           this.episodeNumber === other.episodeNumber;
  }

  toString(): string {
    return `WatchedEpisode(tmdbId=${this.tmdbId}, season=${this.seasonNumber}, episode=${this.episodeNumber})`;
  }
}
