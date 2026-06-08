# CLAUDE.md — apps/api

NestJS backend. DDD/CQRS architecture. PostgreSQL + TypeORM.

---

## Critical Architecture Rules

### 1. Layer dependency direction (STRICT)
```
domain ← application ← infrastructure
domain ← presentation
```
`domain/` must NOT import from `infrastructure/` or `application/`.
TypeORM decorators and anything from `@nestjs/*` must NEVER appear inside `domain/`.

### 2. Implement bottom-up, layer by layer
1. **domain** (VOs → aggregate → events → errors → ports)
2. **application** (commands → queries + read-repo port)
3. **infrastructure** (ORM entities → mappers → repositories → migrations → event publisher)
4. **presentation** (exception filter → guard → controllers + DTOs)

### 3. ORM entities are NOT domain entities
`infrastructure/persistence/entities/` holds TypeORM classes.
`domain/entities/` holds pure domain classes.
The mapper in `infrastructure/persistence/mappers/` is the ONLY bridge.
Never assign a TypeORM entity directly to a domain constructor.

### 4. CQRS via @nestjs/cqrs

**Commands** — extend `Command<TResult>` from `@nestjs/cqrs`:
```typescript
// Return type declared ONCE in the command — not repeated in handler interface
export class ScheduleSessionCommand extends Command<{ sessionId: string }> {
  constructor(public readonly title: string, ...) { super(); }
}

@CommandHandler(ScheduleSessionCommand)
export class ScheduleSessionHandler implements ICommandHandler<ScheduleSessionCommand> {
  async execute(cmd: ScheduleSessionCommand) { ... } // return type inferred
}
```
Controller dispatches via `commandBus.execute(new ScheduleSessionCommand(...))`.

**Queries** — extend `Query<TResult>` from `@nestjs/cqrs`:
```typescript
export class ListAvailableSessionsQuery extends Query<SessionListItem[]> {}

@QueryHandler(ListAvailableSessionsQuery)
export class ListAvailableSessionsHandler implements IQueryHandler<ListAvailableSessionsQuery> {
  async execute() { return this.readRepo.listAvailableSessions(); } // type inferred
}
```
Queries bypass the domain model — delegate directly to `SessionReadRepository` (SQL projection).
`availableSeats` computed in SQL: `capacity - COUNT(enrollments WHERE status = 'active')`

**Config** — `@nestjs/config` + `typeorm-naming-strategies` + `TypeormModule`:
- All TypeORM config lives in `src/infrastructure/persistence/typeorm/`
- `typeormConfig(configService)` — shared factory used by both `TypeormModule` and CLI
- `TypeormModule` — dedicated NestJS module; imported in `AppModule` instead of inline `TypeOrmModule.forRootAsync`
- `autoLoadEntities: true` — entities registered via `TypeOrmModule.forFeature()` are auto-discovered
- `typeorm-cli.config.ts` — reuses `typeormConfig`, loads `.env` via `dotenv.config()`
- `SnakeNamingStrategy` — camelCase fields map to snake_case columns automatically
- Migrations live in `src/infrastructure/persistence/typeorm/migrations/`
- Local dev: `apps/api/.env`. Docker: vars from `docker-compose.yml`
- Variables: `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `NODE_ENV`

**Events** — `EventBus` injected directly into command handlers:
```typescript
constructor(
  @Inject(CLASS_SESSION_REPOSITORY) private readonly repo: ClassSessionRepository,
  private readonly eventBus: EventBus,   // no custom port needed
) {}
// after save:
this.eventBus.publishAll(session.pullEvents());
```
Domain events are plain classes — compatible with `EventBus` as-is (no `IEvent` import in domain).

**Never use `@nestjs/cqrs` AggregateRoot** — it would contaminate domain with framework imports.
Our `AggregateRoot` lives in `shared/domain/base/` as pure TypeScript.

### 5. Optimistic locking
`@VersionColumn()` on `ClassSessionOrmEntity` (not on the domain aggregate).
`EnrollAttendeeUseCase` must catch `OptimisticLockVersionMismatchError` → 409.

---

## Directory Structure

```
src/
├── shared/
│   ├── domain/
│   │   ├── base/                     ← abstract DDD building blocks
│   │   │   ├── aggregate-root.base.ts
│   │   │   ├── domain-error.base.ts
│   │   │   ├── value-object.base.ts
│   │   │   └── index.ts
│   │   ├── uuid.ts                   ← standalone, no subfolder needed
│   │   └── index.ts
│   ├── application/
│   │   ├── use-case.interface.ts
│   │   └── index.ts
│   └── infrastructure/
│       ├── domain-exception.filter.ts
│       ├── config/
│       └── index.ts
└── enrollment/
    ├── domain/
    │   ├── entities/
    │   │   ├── class-session.aggregate.ts
    │   │   ├── enrollment.entity.ts
    │   │   └── index.ts
    │   ├── value-objects/
    │   │   ├── session-id.vo.ts
    │   │   ├── attendee-id.vo.ts
    │   │   ├── capacity.vo.ts
    │   │   ├── session-status.vo.ts
    │   │   ├── enrollment-status.vo.ts
    │   │   └── index.ts
    │   ├── events/
    │   │   ├── session-scheduled.event.ts
    │   │   ├── attendee-enrolled.event.ts
    │   │   ├── enrollment-cancelled.event.ts
    │   │   ├── session-cancelled.event.ts
    │   │   └── index.ts
    │   ├── errors/
    │   │   ├── session-full.error.ts
    │   │   ├── duplicate-enrollment.error.ts
    │   │   ├── session-cancelled.error.ts
    │   │   ├── session-in-the-past.error.ts
    │   │   ├── enrollment-not-found.error.ts
    │   │   ├── session-not-found.error.ts
    │   │   └── index.ts
    │   ├── ports/                    ← repository interfaces (domain side)
    │   │   ├── class-session.repository.ts
    │   │   └── index.ts
    │   └── index.ts
    ├── application/
    │   ├── commands/
    │   │   ├── schedule-session/
    │   │   │   ├── schedule-session.command.ts
    │   │   │   ├── schedule-session.handler.ts   ← @CommandHandler + ICommandHandler
    │   │   │   ├── schedule-session.handler.spec.ts
    │   │   │   └── index.ts
    │   │   ├── enroll-attendee/
    │   │   ├── cancel-enrollment/
    │   │   ├── cancel-session/
    │   │   └── index.ts              ← exports CommandHandlers = [...]
    │   ├── queries/
    │   │   ├── list-available-sessions/
    │   │   │   ├── list-available-sessions.query.ts
    │   │   │   ├── list-available-sessions.handler.ts  ← @QueryHandler + IQueryHandler
    │   │   │   └── index.ts
    │   │   ├── get-session-roster/
    │   │   └── index.ts              ← exports QueryHandlers = [...]
    │   ├── ports/
    │   │   ├── session-read.repository.port.ts   ← read projection port (NOT domain)
    │   │   └── index.ts
    │   └── index.ts
    ├── infrastructure/
    │   └── persistence/
    │       └── typeorm/              ← all TypeORM-specific code grouped here
    │           ├── entities/         # ORM entities (NOT domain entities)
    │           │   ├── class-session.orm-entity.ts
    │           │   ├── enrollment.orm-entity.ts
    │           │   └── index.ts
    │           ├── mappers/
    │           │   ├── class-session.mapper.ts
    │           │   └── index.ts
    │           ├── repositories/
    │           │   ├── typeorm-class-session.repository.ts
    │           │   ├── typeorm-session-read.repository.ts
    │           │   └── index.ts
    │           └── index.ts
    ├── presentation/
    │   ├── controllers/
    │   │   └── sessions.controller.ts
    │   ├── dto/
    │   │   └── index.ts
    │   ├── filters/
    │   │   └── domain-exception.filter.ts
    │   ├── guards/
    │   │   └── actor.guard.ts
    │   └── decorators/
    │       ├── require-role.decorator.ts
    │       ├── actor.decorator.ts
    │       └── index.ts
    └── enrollment.module.ts
```

---

## Folder & Barrel Rules

**Every folder must have an `index.ts`** re-exporting all public symbols. No exceptions.

**Handlers live in per-feature folders, NOT in a flat `use-cases/` folder.**
Each command/query is a self-contained unit with its own subfolder:
```
commands/schedule-session/
  schedule-session.command.ts         ← plain data object
  schedule-session.handler.ts         ← @CommandHandler + ICommandHandler
  schedule-session.handler.spec.ts
  index.ts

queries/list-available-sessions/
  list-available-sessions.query.ts    ← plain data object
  list-available-sessions.handler.ts  ← @QueryHandler + IQueryHandler
  index.ts
```

`commands/index.ts` and `queries/index.ts` export `CommandHandlers` and `QueryHandlers` arrays for module wiring:
```typescript
export const CommandHandlers = [ScheduleSessionHandler, EnrollAttendeeHandler, ...];
```

**Port placement — not all ports are domain ports:**
- `domain/ports/` — порты которые домен сам определяет: `ClassSessionRepository` (агрегат загружается/сохраняется)
- `application/ports/` — порты которые нужны application layer: `SessionReadRepository` (проекционные DTO, домен о них не знает)
- `EventBus` из `@nestjs/cqrs` — инжектируется напрямую в хендлеры, отдельный порт не нужен

**Never flatten infrastructure subfolders.** Each TypeORM concern has its own subfolder — repositories go in `typeorm/repositories/`, never directly in `typeorm/`:
```
infrastructure/persistence/typeorm/
  entities/      ← ORM entity classes
  mappers/       ← domain ↔ ORM mapper
  repositories/  ← write-side + read-side repository adapters
```

**Import via barrel, not deep path:**
```typescript
// CORRECT
import { SessionFullError } from '@src/enrollment/domain/errors';
import { ClassSession } from '@src/enrollment/domain/entities';
import { AggregateRoot } from '@src/shared/domain';

// WRONG — bypasses barrel
import { SessionFullError } from '@src/enrollment/domain/errors/session-full.error';
```

**`./` only for direct siblings in the same folder:**
```typescript
// Inside domain/entities/ — OK
import { Enrollment } from './enrollment.entity';
```

**`../` is never allowed.** Use `@src/` for any cross-directory import.

---

## Shared Code

```
src/shared/     ← reusable across contexts or inherently cross-cutting
src/enrollment/ ← everything that belongs only to the enrollment context
```

**Keep in `enrollment/`** unless a second context needs it or it's inherently cross-cutting.

**`shared/` from day one:**

| Path | Contents |
|------|----------|
| `shared/domain/base/` | `ValueObject`, `AggregateRoot`, `DomainError` base classes |
| `shared/domain/uuid.ts` | `UUID_REGEX` — universal across any UUID-based context |
| `shared/application/` | `UseCase<TInput, TOutput>` interface |
| `shared/infrastructure/` | `DomainExceptionFilter`, config module |

**Layer rules inside `shared/`:**
- `shared/domain/` — zero NestJS/TypeORM imports
- `shared/infrastructure/` — may use NestJS/TypeORM; domain must NOT import it
- `shared/application/` — no framework imports

Never create `src/utils/`, `src/helpers/`, or `src/common/`.

---

## Import Style

Use `@src/` for every cross-directory import (`@src/*` → `src/*` via `tsconfig.json`).
`./` allowed only for direct siblings. `../` is forbidden.

---

## Domain Model Reference

| Method | Throws |
|--------|--------|
| `ClassSession.schedule(props)` | validates capacity > 0, startsAt in future |
| `session.enroll(attendeeId)` | SessionFullError, DuplicateEnrollmentError, SessionCancelledError, SessionInThePastError |
| `session.cancelEnrollment(attendeeId)` | EnrollmentNotFoundError |
| `session.cancel()` | cancels all active enrollments |

Domain errors → HTTP — каждая ошибка хранит свой `statusCode`, фильтр один на всё приложение:
| Error | `statusCode` |
|-------|------|
| SessionFullError, DuplicateEnrollmentError, SessionCancelledError | 409 |
| SessionInThePastError | 422 |
| *NotFoundError | 404 |

`DomainExceptionFilter` (`@Catch(DomainError)`) живёт в `shared/presentation/filters/` — регистрируется один раз в `main.ts`, не меняется при добавлении новых контекстов.

---

## Testing

1. **Unit (domain)** — no DB, pure TypeScript:
   - capacity overflow → `SessionFullError`
   - duplicate enroll → `DuplicateEnrollmentError`
   - enroll on cancelled → `SessionCancelledError`
   - enroll in past → `SessionInThePastError`
   - cancel frees seat; cancel session cancels all enrollments

2. **Concurrency** (flagship): capacity=1, N parallel enrollments → exactly 1 succeeds, rest 409

3. **E2E** (1-2): happy-path enroll + 409 on full session

---

## AI Warnings

- Domain layer: no TypeORM imports, no NestJS decorators, no `@nestjs/cqrs` imports.
- Never extend `@nestjs/cqrs` `AggregateRoot` — use our own from `shared/domain/base/`.
- Mappers: always `ClassSession.reconstitute({...})` with explicit field mapping — never `new ClassSession(ormEntity)`.
- Query handlers must NOT load domain aggregates — use `SessionReadRepository` (SQL projection) only.
- Unit tests for invariants must be a separate pass from happy-path tests.
- File suffix: command handlers are `*.handler.ts`, not `*.use-case.ts`.
