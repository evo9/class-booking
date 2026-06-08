# CLAUDE.md — Class Booking (root)

## Project Overview

Portfolio project demonstrating DDD/CQRS on a real domain invariant:
> Active enrollments on a session must never exceed its capacity.

Monorepo (pnpm workspaces):
- `apps/api` — NestJS backend (see `apps/api/CLAUDE.md`)
- `apps/web` — Angular frontend (see `apps/web/CLAUDE.md`)
- `packages/contracts` — shared DTO types consumed by both apps

Full spec: `SPEC-class-booking.md`

---

## Engineering Principles

Apply universally — every file, every layer, both apps:

- **KISS** — prefer the simplest solution. No speculative abstractions.
- **DRY** — extract duplication only when real and the abstraction is clear. Don't DRY prematurely. Small co-located constants duplicated across two neighbouring files in the same module don't warrant extraction.
- **SOLID**:
  - *Single Responsibility* — each class/function does one thing.
  - *Open/Closed* — open to extension without touching existing code.
  - *Liskov Substitution* — adapters must be fully substitutable for their interfaces.
  - *Interface Segregation* — keep interfaces narrow and focused.
  - *Dependency Inversion* — depend on abstractions, not concretions.

---

## Common Commands

```bash
pnpm db:up                              # start PostgreSQL (Docker)
pnpm migration:run                      # apply migrations
pnpm migration:generate -- --name X    # generate migration from ORM entity changes
pnpm dev                                # run all apps in watch mode
pnpm test                               # unit tests (all workspaces)
pnpm test:e2e                           # e2e + concurrency test
pnpm lint                               # lint all workspaces
pnpm format                             # format all workspaces
```

---

## API Endpoints (reference)

| Method | Path | Use-case | Role |
|--------|------|----------|------|
| POST | `/sessions` | ScheduleSession | admin |
| GET | `/sessions` | ListAvailableSessions | any |
| GET | `/sessions/:id/roster` | GetSessionRoster | admin |
| POST | `/sessions/:id/enrollments` | EnrollAttendee | attendee |
| DELETE | `/sessions/:id/enrollments` | CancelEnrollment | attendee |
| POST | `/sessions/:id/cancel` | CancelSession | admin |

Auth: `X-Actor-Id` (UUID) + `X-Actor-Role` (`admin`|`attendee`) headers.
