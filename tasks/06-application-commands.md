# Task 06 — Application: Command Handlers

**Layer:** application  
**Depends on:** 02, 03, 04  
**Blocks:** 10, 13

## Goal

Implement four command handlers using `@nestjs/cqrs`.
Each handler: one class, one `execute()` method, decorated with `@CommandHandler()`.

## Pattern

```typescript
// schedule-session.command.ts
// Return type declared ONCE in the command via Command<TResult>
import { Command } from '@nestjs/cqrs';

export class ScheduleSessionCommand extends Command<{ sessionId: string }> {
  constructor(
    public readonly title: string,
    public readonly startsAt: Date,
    public readonly capacity: number,
  ) {
    super();
  }
}

// schedule-session.handler.ts
// ICommandHandler<TCommand> — single type param, result inferred from Command<TResult>
@CommandHandler(ScheduleSessionCommand)
export class ScheduleSessionHandler implements ICommandHandler<ScheduleSessionCommand> {
  constructor(
    @Inject(CLASS_SESSION_REPOSITORY) private readonly repo: ClassSessionRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)   private readonly publisher: DomainEventPublisher,
  ) {}

  async execute(cmd: ScheduleSessionCommand) {
    const id = this.repo.nextId();
    const session = ClassSession.schedule({ id, title: cmd.title, startsAt: cmd.startsAt, capacity: new Capacity(cmd.capacity) });
    await this.repo.save(session);
    await this.publisher.publish(session.pullEvents());
    return { sessionId: id.value };
  }
}
```

## Files per command folder

```
commands/schedule-session/
  schedule-session.command.ts
  schedule-session.handler.ts
  schedule-session.handler.spec.ts
  index.ts                         ← exports command + handler

commands/index.ts                  ← re-exports all + exports CommandHandlers array
```

## commands/index.ts shape

```typescript
export * from './cancel-enrollment';
// ... all commands

import { ScheduleSessionHandler } from './schedule-session';
// ... all handlers

export const CommandHandlers = [
  ScheduleSessionHandler,
  EnrollAttendeeHandler,
  CancelEnrollmentHandler,
  CancelSessionHandler,
];
```

## Four commands

| Handler | Domain call | Returns |
|---------|-------------|---------|
| `ScheduleSessionHandler` | `ClassSession.schedule()` | `{ sessionId: string }` |
| `EnrollAttendeeHandler` | `session.enroll()` + catch `OptimisticLockVersionMismatchError` → `SessionFullError` | `void` |
| `CancelEnrollmentHandler` | `session.cancelEnrollment()` | `void` |
| `CancelSessionHandler` | `session.cancel()` | `void` |

## Notes

- `attendeeId` comes from the command (set by controller from actor context)
- Domain errors bubble up — mapped to HTTP in exception filter
- `OptimisticLockVersionMismatchError` from TypeORM is caught in `EnrollAttendeeHandler`, rethrown as `SessionFullError`
- Do NOT import TypeORM or NestJS HTTP exceptions in handlers
