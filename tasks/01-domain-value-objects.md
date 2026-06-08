# Task 01 — Domain: Value Objects

**Layer:** domain  
**Depends on:** nothing  
**Blocks:** 02

## Goal

Create all Value Objects for the `enrollment` bounded context.
These are pure TypeScript — zero framework imports, zero TypeORM.

## Files to create

### `apps/api/src/shared/domain/uuid.ts` (first)

```typescript
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

This is the single source of truth for UUID format validation. Lives in `shared/domain/` because every bounded context that uses UUID-based identifiers will need it.

### `apps/api/src/enrollment/domain/value-objects/`

| File | Content |
|------|---------|
| `session-id.vo.ts` | Branded UUID wrapper. `static create(): SessionId`, `static fromString(s: string): SessionId`. Import `UUID_REGEX` from `@src/shared/domain/uuid`. |
| `attendee-id.vo.ts` | Same shape as SessionId but a distinct type (prevent id mix-ups). Import `UUID_REGEX` from `@src/shared/domain/uuid`. |
| `capacity.vo.ts` | Integer > 0. Throws in constructor if violated. Exposes `value: number`. |
| `session-status.vo.ts` | Enum/union: `'scheduled' \| 'cancelled'`. |
| `enrollment-status.vo.ts` | Enum/union: `'active' \| 'cancelled'`. |

## Rules

- VOs are immutable (readonly fields).
- SessionId and AttendeeId must be nominally distinct types (use a brand/phantom type so TypeScript rejects passing one where the other is expected).
- Both import `UUID_REGEX` from `@src/shared/domain/uuid` — never declare it locally.
- No `class-validator` decorators here — validation is in the constructor.
