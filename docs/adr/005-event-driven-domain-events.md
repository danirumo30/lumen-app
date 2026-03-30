# ADR 005: Event-Driven Domain Events

**Status:** Under Consideration  
**Date:** 2026-03-29  
**Commit:** 957959f  

---

## Context

Necesitamos comunicación desacoplada entre bounded contexts (ej. Auth registra → Social crea perfil). Eventos de dominio permiten eventual consistency sin acoplamiento directo.

## Decision

### Adoptar Domain Events con Event Bus In-Memory

**Estado actual**: Los eventos de dominio existen (en `src/domain/*/events/`) pero no se publican/consisten sistemáticamente.

**Implementación planeada**:

#### 1. Event Bus Interface

```typescript
// src/domain/shared/events/event-bus.port.ts
export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<S extends DomainEvent>(
    eventType: Type<S>,
    handler: IEventSubscriber<S>
  ): void;
}
```

#### 2. In-Memory Implementation

```typescript
// src/infrastructure/events/in-memory-event-bus.ts
export class InMemoryEventBus implements IEventBus {
  private subscribers: Map<string, IEventSubscriber<any>[]> = new Map();

  subscribe<S extends DomainEvent>(
    eventType: Type<S>,
    handler: IEventSubscriber<S>
  ): void {
    const name = eventType.name;
    const list = this.subscribers.get(name) || [];
    list.push(handler as IEventSubscriber<any>);
    this.subscribers.set(name, list);
  }

  async publish(event: DomainEvent): Promise<void> {
    const type = event.constructor.name;
    const handlers = this.subscribers.get(type) || [];
    // Fire-and-forget con error handling
    await Promise.allSettled(
      handlers.map(h => h.handle(event).catch(console.error))
    );
  }
}
```

#### 3. Event Publishing desde Domain

```typescript
// En un command handler (Application layer)
export class RegisterUserCommandHandler {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(cmd: RegisterUserCommand): Promise<Result<UserDto, DomainError>> {
    const user = User.register(...);
    await this.userRepo.save(user);
    
    // Publicar evento
    const event = UserRegisteredEvent.create(user.id.value, user.email.value);
    await this.eventBus.publish(event);

    return Result.success(UserDto.fromEntity(user));
  }
}
```

#### 4. Event Subscribing (Cross-Context)

```typescript
// Social context subscriber
export class CreateProfileOnUserRegistered implements IEventSubscriber<UserRegisteredEvent> {
  constructor(private readonly profileRepo: IUserProfileRepository) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    const profile = UserProfile.createForNewUser(event.payload.userId);
    await this.profileRepo.save(profile);
  }
}

// Startup
const eventBus = new InMemoryEventBus();
eventBus.subscribe(
  UserRegisteredEvent,
  new CreateProfileOnUserRegistered(profileRepo)
);
```

#### 5. Correlation IDs

Para trazar request a través de múltiples eventos:

```typescript
// Generar correlationId en API route
const correlationId = uuidv4();
const eventBus = new InMemoryEventBus({ correlationId });

// Pasar a través de headers o contexto
eventBus.publish(event);  // event.metadata.correlationId preservado
```

### Eventos Definidos

```
Auth Context Events:
- UserRegisteredEvent
- EmailVerifiedEvent
- PasswordResetRequestedEvent
- PasswordResetCompletedEvent
- UserLoggedInEvent

Media Context Events:
- MediaToggledEvent (watch/favorite/planned)
- MediaProgressUpdatedEvent
- MediaRatedEvent
- MediaPlatinumAwardedEvent

Social Context Events:
- ProfileUpdatedEvent
- UserFollowedEvent
- UserUnfollowedEvent
```

### Transactional Outbox Pattern (Opcional, para producción)

**Problema**: Si publicas evento después de `save()` y el proceso falla, puedes perder eventos.

**Solución**: Tabla `outbox` en DB, transacción atómica:

```sql
BEGIN;
INSERT INTO users (...);
INSERT INTO outbox (event_type, payload, status) VALUES ('UserRegistered', '...', 'PENDING');
COMMIT;
-- Worker externo lee 'PENDING' y publica a message broker
```

**Decisión**: Para MVP, usamos **memory bus** confiando en que si el comando termina, el evento se publica. Para produccion a largo plazo, evaluar Kafka/RabbitMQ + outbox.

## Alternatives Considered

### 1. Direct Repository Calls (No Events)

**Pros**: Simple, síncrono, fácil debug  
**Cons**: Acoplamiento fuerte entre contexts (Auth → Social repo direkt)

**Decisión**: Rechazada por violar bounded context boundaries

### 2. Message Broker (Kafka/RabbitMQ)

**Pros**: Persistente, escalable, múltiples consumidores, replay  
**Cons**: Overhead operacional, complejidad, costo

**Decisión**: Posible futuro, no para MVP

### 3. Database Polling (Event Sourcing Lite)

**Pros**: Simple, usa DB existente  
**Cons**: Latencia, ineficiente, polling overhead  
**Decisión**: No necesario

## Consequences

### Positivas
- **Desacoplamiento**: Auth no conoce Social, solo publica evento
- **Extensibilidad**: Nuevos listeners sin modificar productor
- **Async**: No bloqueante
- **Observabilidad**: Eventos como logs de negocio

### Negativas
- **Eventual consistency**: Perfil no se crea instantáneamente (ms-latencia)
- **Debugging**: Flujo harder to trace (necesita correlationId)
- **Error handling**: ¿Qué pasa si subscriber falla? Retry needed
- **Ordering**: Eventos pueden llegar fuera de orden (raro en memoria)

## Implementation Plan (Fase Futura)

1. Crear `IEventBus` port en `src/domain/shared/events/`
2. Implementar `InMemoryEventBus` en `src/infrastructure/events/`
3. Modificar command handlers para publicar eventos relevantes
4. Crear subscribers para cross-context reactions:
   - `UserRegistered` → crear `UserProfile`
   - `EmailVerified` → limpiar caché, notificar frontend
   - `MediaToggled` → actualizar stats globales
5. Agregar correlationId en middleware de API
6. Tests de integración verifying event flow
7. (Opcional) Outbox table + worker si es necesario

## Known Limitations

- **In-memory** → eventos se pierden si server crash
- **No ordering гарантированный**: Si múltiples eventos del mismo tipo, orden no garantizado (pero en práctica, Christopher)
- **No replay**: Sin persistencia, no se pueden reconstruir estados
- **Single process**: No funciona en multi-instance deployments sin message broker

---

**Próximo**: [CQRS and Commands/Queries](./006-cqrs-and-commands-queries.md)
