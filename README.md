# Class Booking

A full-stack application for enrolling attendees into capacity-limited class sessions. Built to demonstrate **Domain-Driven Design**, **CQRS**, and clean layered architecture on a domain with a real invariant:

> **Active enrollments on a session must never exceed its capacity** — including under concurrent requests.

The architecture decisions below are the point. The booking feature is the vehicle.

---

## Tech stack

| Layer    | Technology                                                 |
|----------|------------------------------------------------------------|
| Backend  | NestJS, TypeScript, DDD/CQRS (`@nestjs/cqrs`)              |
| Database | PostgreSQL + TypeORM (migrations, optimistic locking)      |
| Auth     | JWT in `httpOnly` cookie, argon2 password hashing          |
| Frontend | Angular 22 (standalone components, signals, OnPush)        |
| Monorepo | pnpm workspaces, shared `@class-booking/contracts` package |

---

## Architecture

### Layer dependencies

```
┌─────────────────────────────────────────────────────────┐
│  Presentation (controllers, guards, DTOs)               │
│           │                    │                        │
│           ▼                    ▼                        │
│  Application (commands, queries, ports)                 │
│           │                    │                        │
│           ▼                    │                        │
│    Domain (aggregates,    Infrastructure (TypeORM,      │
│    value objects, errors)  repositories, JWT, seeding)  │
│                                     │                   │
│                                     ▼                   │
│                         Domain ports (interfaces)       │
└─────────────────────────────────────────────────────────┘
```

`domain/` has zero imports from `infrastructure/` or `application/`. TypeORM decorators and NestJS annotations never appear inside `domain/`. Infrastructure depends on domain ports (interfaces), not the other way around.

### CQRS split

**Write side** (commands): load aggregate from the write repository → call a domain method that enforces invariants → save → publish domain events.

**Read side** (queries): bypass the domain model entirely. Query handlers call a `SessionReadRepository` that runs a SQL projection directly — no aggregates loaded, no domain objects instantiated.

```
POST /sessions/:id/enrollments
  → EnrollAttendeeCommand
  → EnrollAttendeeHandler
      → ClassSessionRepository.findById()   ← loads aggregate
      → session.enroll(attendeeId)          ← enforces invariant
      → ClassSessionRepository.save()       ← optimistic lock check
      → EventBus.publishAll()

GET /sessions
  → ListAvailableSessionsQuery
  → ListAvailableSessionsHandler
      → SessionReadRepository.listAvailableSessions()  ← raw SQL, no aggregate
```

---

## Domain model & invariant

`ClassSession` is the aggregate root. `Enrollment` lives inside it — not as a standalone entity — because the capacity invariant spans both: "can this attendee be added?" requires knowing all current enrollments. An aggregate boundary is drawn where consistency must be enforced atomically.

```
ClassSession (aggregate root)
├── id: SessionId
├── capacity: Capacity         ← value object, enforces > 0
├── status: SessionStatus      ← scheduled | cancelled
└── enrollments: Enrollment[]  ← inside the boundary
    ├── attendeeId: AttendeeId
    └── status: EnrollmentStatus
```

Domain errors are plain TypeScript classes (no framework imports). Each carries its own HTTP status code; a single `DomainExceptionFilter` maps them to responses.

| Error | Status |
|-------|--------|
| `SessionFullError`, `DuplicateEnrollmentError`, `SessionCancelledError` | 409 |
| `SessionInThePastError` | 422 |
| `*NotFoundError` | 404 |

---

## Bounded contexts

The API has two bounded contexts under `src/contexts/`:

### Enrollment

Core domain. Owns `ClassSession`, `Enrollment`, all capacity invariants, and the CQRS command/query handlers. The write side knows only `attendeeId: UUID` — it never loads a `User` object. Contexts communicate by ID, not by object reference.

### Identity

Owns `User` (email, password hash, display name, role). Handles login, JWT issuance, and argon2 password hashing. Isolated from Enrollment: adding auth requirements to Enrollment would not touch its domain.

**Role as a field, not RBAC.** `User.role` is `'admin' | 'attendee'` — a value object, not a permission system. This is sufficient for two roles with no per-resource permissions. The extension trigger is a third role or per-resource ACL, not the number of endpoints.

---

## Design trade-offs

### SQL projection vs. denormalized counter

`availableSeats` is computed in the read query as:

```sql
s.capacity - COUNT(e.id) FILTER (WHERE e.status = 'active') AS "availableSeats"
```

**Why this is correct here:** reads are low-to-medium volume, enrollment/cancellation frequency is low, and the result is always consistent — no drift possible.

**When you'd switch to a denormalized `available_seats` column:** very high read volume where `COUNT` becomes a bottleneck (millions of rows, hot sessions). The cost: the counter can drift from the real count if the update and insert aren't in one transaction; you need periodic reconciliation; the complexity class increases. That's premature optimization at this scale.

### Optimistic vs. pessimistic locking

**Current approach:** `@VersionColumn()` on the ORM entity. Concurrent writers each load the same version; one saves successfully, the other receives `OptimisticLockVersionMismatchError` → 409. No writer blocks waiting for a lock to release.

**Alternative: `SELECT ... FOR UPDATE`** — simpler code, serializes writes at the DB level. Downside: holds a row lock for the full transaction duration, reducing throughput under sustained concurrent load.

Optimistic locking is the right fit here: transactions are short, conflicts are occasional, and retrying a 409 is cheap for the client.

### Read-side JOIN across context boundaries

The roster endpoint joins `enrollments` (Enrollment context) with `users` (Identity context) to display attendee names:

```sql
SELECT e.attendee_id, u.display_name, e.enrolled_at
FROM enrollments e
INNER JOIN users u ON u.id = e.attendee_id
WHERE e.session_id = :sessionId AND e.status = 'active'
```

**Why this is acceptable:** CQRS does not extend aggregate boundaries to read queries. A read projection is a view for display purposes, not a domain operation. When both contexts share the same database, a JOIN is the simplest correct solution.

**When you'd add an `AttendeeDisplayPort` instead:** separate storage (different services, different databases). Two Postgres instances in separate services require a port just as much as Postgres + MongoDB — the trigger is the inability to JOIN, not the engine type.

### Auth: JWT in `httpOnly` cookie

The token is stored in an `httpOnly` cookie, not `localStorage`. JavaScript cannot read `httpOnly` cookies, so XSS attacks cannot extract the token.

The Angular frontend never sees the JWT. On each request, the browser attaches the cookie automatically. The NestJS `JwtAuthGuard` verifies it server-side and populates the `actor` context used by guards and decorators.

---

## Cookie, dev proxy, and production

**Why a dev proxy is required:** `sameSite: 'lax'` cookies are only sent on same-origin requests. In development, Angular runs on `:4200` and the API on `:3000` — different origins. The Angular dev server proxies `/api/*` → `http://localhost:3000`, making all requests same-origin from the browser's perspective.

```json
// apps/web/proxy.conf.json
{ "/api": { "target": "http://localhost:3000", "secure": false, "changeOrigin": true } }
```

**Production:** an nginx reverse proxy handles both in one origin:

```
/api/* → NestJS backend    (cookie: secure: true, sameSite: lax)
/*     → Angular static files
```

No CORS configuration needed in production because there is no cross-origin boundary.

### Why no SSR

Every route is behind a login — nothing to index. Server-side rendering would require forwarding the browser's `httpOnly` cookie into the server-side HTTP client manually (the browser cookie jar is unavailable server-side). Client-side rendering avoids this complexity with no trade-off at this scale.

---

## Out of scope

These are decisions, not gaps:

| Area | Reasoning |
|------|-----------|
| Real user registration | Belongs to a separate Access bounded context with email verification, password reset, OAuth. The current Identity context is a scoped stub. |
| Payments, notifications, waitlists | Separate contexts. Adding them would not touch the Enrollment domain. |
| Event sourcing / separate read DB | Over-engineered at this scale. The SQL projection is simpler and always consistent. |
| Multitenancy | Not in scope for this domain. |
| Rich UI / design system | Not the point. Tailwind utility classes only. |

---

## Repository layout

```
class-booking/
├── apps/
│   ├── api/                    # NestJS backend
│   │   └── src/
│   │       ├── contexts/
│   │       │   ├── enrollment/ # Core domain (ClassSession, CQRS)
│   │       │   └── identity/   # Auth, User aggregate, JWT
│   │       └── shared/         # AggregateRoot base, DomainExceptionFilter
│   └── web/                    # Angular frontend
│       └── src/app/
│           ├── core/           # AuthStore, interceptors, guards
│           └── pages/          # Route-level components
└── packages/
    └── contracts/              # Shared DTOs (SessionListItemDto, etc.)
```

---

## Getting started

### Prerequisites

- **Node.js 24.16.0** — pinned in [`.nvmrc`](./.nvmrc).
- **pnpm** — enabled via Corepack (ships with Node).
- **Docker** — for PostgreSQL.

```bash
nvm install 24.16.0 && nvm use
corepack enable
```

### Running locally

```bash
pnpm install
cp .env.example .env
pnpm db:up           # start PostgreSQL in Docker
pnpm migration:run   # apply all migrations
pnpm dev             # contracts + api + web in watch mode
```

- API → http://localhost:3000
- Web → http://localhost:4200 (proxied to API via dev proxy)

### Dev credentials

Seeded automatically in `development` mode on first boot:

| Email | Password | Role |
|-------|----------|------|
| admin@booking.dev | admin123 | admin |
| alice@booking.dev | alice123 | attendee |
| bob@booking.dev | bob123 | attendee |
| carol@booking.dev | carol123 | attendee |

---

## Available scripts

| Script                   | Description |
|--------------------------|-------------|
| `pnpm dev`               | Run contracts (watch), api, and web in parallel |
| `pnpm dev:api`           | Run only the NestJS API in watch mode |
| `pnpm dev:web`           | Run only the Angular app |
| `pnpm build`             | Build contracts, then api and web |
| `pnpm test`              | Unit tests across all workspaces |
| `pnpm test:e2e`          | API end-to-end tests (includes concurrency test) |
| `pnpm lint`              | Lint all workspaces |
| `pnpm db:up`             | Start PostgreSQL (Docker) |
| `pnpm db:down`           | Stop PostgreSQL |
| `pnpm migration:migrate` | Apply TypeORM migrations |
| `pnpm migration:diff`    | Generate migration from entity changes |

## Running the API in Docker

```bash
docker compose --profile full up --build
```

Builds the API image (multi-stage, pnpm via Corepack) and starts it alongside PostgreSQL. Plain `docker compose up` starts only PostgreSQL (the `api` service is behind the `full` profile).

## Environment variables

| Variable | Example | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_USER` | `booking` | Database user |
| `POSTGRES_PASSWORD` | `booking` | Database password |
| `POSTGRES_DATABASE` | `class_booking` | Database name |
| `JWT_SECRET` | `change-me` | Secret for JWT signing |
| `NODE_ENV` | `development` | Runtime environment |

See [`.env.example`](./.env.example) for the full list.

## Testing

```bash
pnpm test         # unit tests (domain invariants, command/query handlers)
pnpm test:e2e     # e2e + overbooking concurrency test
```

The concurrency test fires multiple parallel enrollment requests at a session with one free seat and asserts exactly one succeeds. This is the project's key proof that the aggregate invariant holds under load.

---

## License

MIT
