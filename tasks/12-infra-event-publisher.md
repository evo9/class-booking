# Task 12 — ~~Infrastructure: Domain Event Publisher~~ (REMOVED)

**Статус:** удалена — не нужна.

## Почему

`@nestjs/cqrs` уже предоставляет `EventBus`. Command handlers инжектируют его напрямую:

```typescript
constructor(
  @Inject(CLASS_SESSION_REPOSITORY) private readonly repo: ClassSessionRepository,
  private readonly eventBus: EventBus,
) {}

async execute(cmd: ...) {
  // ...
  await this.repo.save(session);
  this.eventBus.publishAll(session.pullEvents()); // ← встроенный метод EventBus
}
```

`DomainEventPublisher` кастомный порт/адаптер был лишней обёрткой над тем что уже есть в пакете.

## Event handlers (опционально, для демо)

Если нужно реагировать на доменные события (логирование, нотификации):

```typescript
@EventsHandler(AttendeeEnrolledEvent)
export class AttendeeEnrolledHandler implements IEventHandler<AttendeeEnrolledEvent> {
  handle(event: AttendeeEnrolledEvent): void {
    // log, notify — out of scope
  }
}
```

Регистрируется в `providers` модуля, но для базового демо не нужен.
