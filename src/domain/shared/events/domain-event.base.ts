export interface DomainEvent {
  readonly occurredOn: Date;
  readonly eventId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredOn = new Date();
  public readonly eventId: string;

  constructor() {
    // Genera un UUID v4 simple (podríamos usar crypto.randomUUID() en runtime)
    this.eventId = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
