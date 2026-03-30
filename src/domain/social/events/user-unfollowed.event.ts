import { BaseDomainEvent } from "../../shared/events/domain-event.base";

export class UserUnfollowedEvent extends BaseDomainEvent {
  constructor(
    public readonly followerId: string,
    public readonly unfollowedId: string
  ) {
    super();
  }
}
