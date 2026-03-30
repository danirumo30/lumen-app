import { BaseDomainEvent } from "../../shared/events/domain-event.base";

export class EmailVerifiedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super();
  }
}
