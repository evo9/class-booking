# Task 03 — Domain: Events & Errors

**Layer:** domain  
**Depends on:** 01 (Value Objects)  
**Blocks:** 02, 06

## Goal

Create domain event classes and domain error classes.
These are plain TypeScript — no NestJS, no HTTP codes.

## Domain Events

`apps/api/src/enrollment/domain/events/`

Plain classes — no base class, no interface. `EventBus` accepts any object.

| File | Fields |
|------|--------|
| `session-scheduled.event.ts` | `sessionId: SessionId, title: string, startsAt: Date, capacity: Capacity` |
| `attendee-enrolled.event.ts` | `sessionId: SessionId, attendeeId: AttendeeId, enrolledAt: Date` |
| `enrollment-cancelled.event.ts` | `sessionId: SessionId, attendeeId: AttendeeId` |
| `session-cancelled.event.ts` | `sessionId: SessionId` |

Do NOT add `implements DomainEvent` or any shared interface — there is none.

## Domain Errors

`apps/api/src/enrollment/domain/errors/`

Each is a class extending `Error` with a descriptive message:

| File | Class |
|------|-------|
| `session-full.error.ts` | `SessionFullError` |
| `duplicate-enrollment.error.ts` | `DuplicateEnrollmentError` |
| `session-cancelled.error.ts` | `SessionCancelledError` |
| `session-in-the-past.error.ts` | `SessionInThePastError` |
| `enrollment-not-found.error.ts` | `EnrollmentNotFoundError` |
| `session-not-found.error.ts` | `SessionNotFoundError` |

## Rules

- Domain errors must NOT extend `HttpException` or any NestJS class.
- HTTP mapping lives exclusively in the exception filter (task 13).
- Add `index.ts` barrel exports for both `events/` and `errors/`.
