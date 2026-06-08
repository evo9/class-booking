# Task 07 — Application: Query Handlers + Read-Repository Port

**Layer:** application  
**Depends on:** 01, 03  
**Blocks:** 10, 13

## Goal

Two query handlers using `@nestjs/cqrs`. Queries bypass the domain model entirely —
they go straight to a SQL projection via a read-repository port.

## Read-repository port

`enrollment/application/ports/session-read.repository.port.ts`

```typescript
export const SESSION_READ_REPOSITORY = Symbol('SessionReadRepository');

export interface SessionListItem {
  id: string;
  title: string;
  startsAt: Date;
  capacity: number;
  availableSeats: number;
  status: 'scheduled' | 'cancelled';
}

export interface RosterEntry {
  attendeeId: string;
  enrolledAt: Date;
}

export interface SessionReadRepository {
  listAvailableSessions(): Promise<SessionListItem[]>;
  getSessionRoster(sessionId: string): Promise<RosterEntry[]>;
}
```

Add to `application/ports/index.ts`.

## Pattern

```typescript
// list-available-sessions.query.ts
// Return type declared ONCE in the query via Query<TResult>
import { Query } from '@nestjs/cqrs';

export class ListAvailableSessionsQuery extends Query<SessionListItem[]> {}

// get-session-roster.query.ts
export class GetSessionRosterQuery extends Query<RosterEntry[]> {
  constructor(public readonly sessionId: string) {
    super();
  }
}

// list-available-sessions.handler.ts
// IQueryHandler<TQuery> — single type param, result inferred from Query<TResult>
@QueryHandler(ListAvailableSessionsQuery)
export class ListAvailableSessionsHandler implements IQueryHandler<ListAvailableSessionsQuery> {
  constructor(
    @Inject(SESSION_READ_REPOSITORY) private readonly readRepo: SessionReadRepository,
  ) {}

  async execute() {
    return this.readRepo.listAvailableSessions();
  }
}
```

## Files per query folder

```
queries/list-available-sessions/
  list-available-sessions.query.ts
  list-available-sessions.handler.ts
  index.ts

queries/get-session-roster/
  get-session-roster.query.ts
  get-session-roster.handler.ts
  index.ts

queries/index.ts   ← re-exports all + exports QueryHandlers array
```

## queries/index.ts shape

```typescript
export const QueryHandlers = [
  ListAvailableSessionsHandler,
  GetSessionRosterHandler,
];
```

## Notes

- Query handlers must NOT import `ClassSession`, `Enrollment`, or any domain entity
- `availableSeats` computed in SQL: `capacity - COUNT(e.id) FILTER (WHERE e.status = 'active')`
- `GetSessionRosterQuery` receives `sessionId: string` in constructor
