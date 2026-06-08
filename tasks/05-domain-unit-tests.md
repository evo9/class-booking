# Task 05 — Domain: Unit Tests for Aggregate Invariants

**Layer:** domain (test)  
**Depends on:** 02, 03  
**Blocks:** nothing (can run standalone)

## Goal

Test every invariant of `ClassSession` without any database or NestJS bootstrap.
These tests are the proof that the domain layer is genuinely isolated.

## File to create

`apps/api/src/enrollment/domain/class-session.aggregate.spec.ts`

## Test cases (each should be a separate `it`)

### `schedule()`
- [ ] creates session with valid props
- [ ] raises `SessionScheduled` event
- [ ] throws if `startsAt` is in the past

### `enroll()`
- [ ] happy path: enroll a new attendee, event `AttendeeEnrolled` raised
- [ ] throws `SessionCancelledError` if session is cancelled
- [ ] throws `SessionInThePastError` if `startsAt` is in the past
- [ ] throws `DuplicateEnrollmentError` if attendee already enrolled
- [ ] throws `SessionFullError` when capacity is full (fill to capacity, then try one more)
- [ ] after `cancelEnrollment()`, the freed seat allows a new enroll

### `cancelEnrollment()`
- [ ] happy path: enrollment status set to cancelled, event raised
- [ ] throws `EnrollmentNotFoundError` if attendee not enrolled

### `cancel()`
- [ ] sets session status to `cancelled`
- [ ] all active enrollments become cancelled
- [ ] raises `SessionCancelled` event

### `availableSeats()`
- [ ] returns `capacity - activeEnrollments`
- [ ] cancelled enrollments do not count against seats

## Notes

- Build aggregate instances directly (`ClassSession.schedule(...)`) — no mocks, no DI.
- Use Jest (already in api package).
- These tests run with `pnpm test:api` and must pass with zero infrastructure setup.
