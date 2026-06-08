# Task 18 — README: Architecture Notes & Trade-off Analysis

**Layer:** documentation  
**Depends on:** all  
**Blocks:** nothing (but write last — after implementation is stable)

## Goal

README is half the portfolio value. Write it as engineering documentation, not a setup manual.

## Sections to write (beyond basic setup)

### Domain & Invariant

Explain the main invariant in plain language. Show the aggregate boundary.
Why is `ClassSession` the aggregate root? Why does `Enrollment` live inside it?

### Architecture diagram

ASCII or Mermaid diagram showing layer dependencies:
```
Presentation → Application → Domain ← Infrastructure
```
Annotate: "domain port (interface)" at the boundary, "adapter" on the infrastructure side.

### CQRS split

Explain the concrete split:
- Write side: load aggregate → call method → save (optimistic lock).
- Read side: SQL projection, no domain model instantiated.

### Trade-off: SQL projection vs denormalized counter

**Current approach:** `availableSeats = capacity - COUNT(active enrollments)` in SQL.

**When this is correct:**
- Low-to-medium read traffic.
- Enroll/cancel operations are less frequent than reads.
- Always consistent — no drift possible.

**When you'd switch to a denormalized `available_seats` column:**
- Very high read volume where `COUNT` becomes a bottleneck (millions of rows, hot sessions).
- Price: counter can drift from actual count if update + insert aren't in one transaction; needs periodic reconciliation job; extra complexity class.
- Verdict: **premature optimization for this scale**. The SQL projection is strictly better here.

### Trade-off: Optimistic vs pessimistic locking

**Current:** `@VersionColumn()` optimistic lock. Concurrent writers load the same version, one saves successfully, the other gets `OptimisticLockVersionMismatchError` → 409.

**Alternative: `SELECT ... FOR UPDATE`** — simpler code, serializes writes at DB level. Downside: holds a row lock for the duration of the transaction, reduces throughput under sustained concurrent load.

**Verdict:** optimistic lock is better for this pattern (short transactions, occasional conflict is acceptable).

### Auth boundary

"In production, `ActorGuard` would be replaced by a JWT strategy consuming tokens issued by a separate Access bounded context. The stub isolates this decision without leaking auth concerns into the domain."

### Out of scope (explicit)

List everything intentionally excluded (see spec §13) and frame them as decisions, not gaps:
- Real authentication / user management → separate Access context
- Payments, notifications, waitlists → separate contexts
- Event sourcing, CQRS read DB (e.g., Elasticsearch) → over-engineered for this scale
- Multitenancy → not in scope
- Rich UI / design system → not the point of this project

## Notes

- Write in English (portfolio target audience).
- Keep it concise — reviewers skim. Use headers, short paragraphs, one diagram.
- The trade-off sections (CQRS, locking, auth) are what differentiate this from a CRUD tutorial.
