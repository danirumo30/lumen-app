import { BaseDomainEvent } from "../../shared/events/domain-event.base";

export class UserRegisteredEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username?: string
  ) {
    super();
  }
}
