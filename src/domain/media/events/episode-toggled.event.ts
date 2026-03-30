import { BaseDomainEvent } from "../../shared/events/domain-event.base";

export class EpisodeToggledEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly tmdbId: number,
    public readonly seasonNumber: number,
    public readonly episodeNumber: number,
    public readonly action: "watched" | "unwatched"
  ) {
    super();
  }
}
