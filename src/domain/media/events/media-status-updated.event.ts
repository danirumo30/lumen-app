import { BaseDomainEvent } from "../../shared/events/domain-event.base";
import { MediaId } from "../../shared/value-objects/media-id";

export class MediaStatusUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly mediaId: MediaId,
    public readonly mediaType: string,
    public readonly status: "favorite" | "watched" | "planned"
  ) {
    super();
  }
}
