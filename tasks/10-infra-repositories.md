# Task 10 — Infrastructure: Repository Adapters

**Layer:** infrastructure  
**Depends on:** 08, 09, 07  
**Blocks:** 12

## Goal

Implement the two repository adapters:
1. Write-side: `TypeOrmClassSessionRepository` — implements the domain port
2. Read-side: `TypeOrmSessionReadRepository` — implements the query port, uses raw SQL

## Files to create

`apps/api/src/enrollment/infrastructure/persistence/typeorm/repositories/`

### `typeorm-class-session.repository.ts`

Implements `ClassSessionRepository` (domain port from task 04).

```typescript
@Injectable()
export class TypeOrmClassSessionRepository implements ClassSessionRepository {
  constructor(
    @InjectRepository(ClassSessionOrmEntity)
    private readonly repo: Repository<ClassSessionOrmEntity>,
  ) {}

  async findById(id: SessionId): Promise<ClassSession | null> {
    const orm = await this.repo.findOne({ where: { id: id.value }, relations: ['enrollments'] });
    return orm ? ClassSessionMapper.toDomain(orm) : null;
  }

  async save(session: ClassSession): Promise<void> {
    const orm = ClassSessionMapper.toOrm(session);
    await this.repo.save(orm);
    // TypeORM throws OptimisticLockVersionMismatchError here if version conflict
  }

  nextId(): SessionId {
    return SessionId.create(); // UUID v4
  }
}
```

### `typeorm-session-read.repository.ts`

Implements `SessionReadRepository` (query port from task 07).
Uses QueryBuilder — no domain objects involved.

```typescript
async listAvailableSessions(): Promise<SessionListItem[]> {
  // SELECT s.id, s.title, s.starts_at, s.capacity, s.status,
  //   s.capacity - COUNT(e.id) FILTER (WHERE e.status = 'active') AS available_seats
  // FROM class_sessions s
  // LEFT JOIN enrollments e ON e.session_id = s.id
  // GROUP BY s.id
  // ORDER BY s.starts_at ASC
}

async getSessionRoster(sessionId: string): Promise<RosterEntry[]> {
  // SELECT attendee_id, enrolled_at FROM enrollments
  // WHERE session_id = $1 AND status = 'active'
  // ORDER BY enrolled_at ASC
}
```

## Notes

- `save()` on write-side does NOT call `session.pullEvents()` — that's the use-case's job (after save succeeds).
- Read-side must never instantiate domain objects.
- Both repositories are registered as providers in `enrollment.module.ts` bound to the DI tokens.
