# Task 02 — Domain: ClassSession Aggregate + Enrollment Entity

**Layer:** domain  
**Depends on:** 01 (Value Objects)  
**Blocks:** 03, 04, 05

## Goal

Implement the aggregate root `ClassSession` and the inner entity `Enrollment`.
All business logic lives here. No TypeORM. No NestJS.

## Files to create

### `apps/api/src/enrollment/domain/enrollment.entity.ts`

Fields:
- `attendeeId: AttendeeId`
- `enrolledAt: Date`
- `status: EnrollmentStatus`

Plain class, no decorators.

### `apps/api/src/enrollment/domain/class-session.aggregate.ts`

Fields:
- `id: SessionId`
- `title: string`
- `startsAt: Date`
- `capacity: Capacity`
- `status: SessionStatus`
- `enrollments: Enrollment[]` (private)
- `version: number`
- `private _events: DomainEvent[]` (collect raised events)

Methods:

| Method | Invariants to enforce |
|--------|-----------------------|
| `static schedule(props): ClassSession` | `startsAt` must be in the future; raises `SessionScheduled` |
| `enroll(attendeeId): void` | status must be `scheduled`; startsAt must be in future; no duplicate active enrollment for this attendee; active enrollments count < capacity; raises `AttendeeEnrolled` |
| `cancelEnrollment(attendeeId): void` | enrollment must exist and be active; raises `EnrollmentCancelled` |
| `cancel(): void` | sets status to `cancelled`; cancels all active enrollments; raises `SessionCancelled` |
| `availableSeats(): number` | `capacity.value - activeEnrollments.length` |
| `pullEvents(): DomainEvent[]` | return and clear `_events` |

## Invariant errors to throw

Import from `domain/errors/` (created in task 03 — implement errors first or alongside):
- `SessionFullError` — active enrollments >= capacity
- `DuplicateEnrollmentError` — attendee already has active enrollment
- `SessionCancelledError` — session.status === 'cancelled'
- `SessionInThePastError` — startsAt <= now

## Notes

- `Enrollment[]` is encapsulated — no external mutation. Expose readonly view if needed.
- `pullEvents()` pattern: aggregate collects events internally; caller drains them after save.
