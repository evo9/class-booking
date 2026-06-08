# Task 04 — Domain: Repository Port (Interface)

**Layer:** domain  
**Depends on:** 01, 02  
**Blocks:** 06, 09

## Goal

Define the repository interface (port) that the application layer depends on.
This is a TypeScript interface — no TypeORM, no implementation.

## File to create

`apps/api/src/enrollment/domain/ports/class-session.repository.ts`

Plus the barrel: `apps/api/src/enrollment/domain/ports/index.ts`

```typescript
export interface ClassSessionRepository {
  findById(id: SessionId): Promise<ClassSession | null>;
  save(session: ClassSession): Promise<void>;
  nextId(): SessionId;
}
```

## Notes

- `save()` handles both insert and update (upsert semantics). The infrastructure adapter decides which based on whether the aggregate is new.
- The interface is the **only** thing the application layer knows about persistence — no TypeORM types leak through it.
- Inject via NestJS DI token (string or Symbol), resolved to `TypeOrmClassSessionRepository` in the module.
