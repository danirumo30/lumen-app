import { BaseDomainEvent } from "../../shared/events/domain-event.base";

export class UserFollowedEvent extends BaseDomainEvent {
  constructor(
    public readonly followerId: string,
    public readonly followedId: string,
    public readonly followedUsername: string
  ) {
    super();
  }
}
