---
name: class-booking-reviewer
description: >
  Professional code review skill for the class-booking DDD/CQRS project.
  Use this skill whenever the user asks to review, check, or validate code in this project —
  even if they phrase it casually: "does this look right?", "check my domain layer",
  "is this correct architecture?", "review what I just wrote", "ревью", "проверь код",
  "посмотри на мой код". This skill deeply understands the project's architecture:
  DDD aggregate with invariants, clean layer separation (domain ← application ← infrastructure),
  CQRS write/read split, optimistic locking, TypeORM mapper pattern, @src import aliases,
  Angular OnPush. It catches violations before they ship and produces a structured report
  with CRITICAL / WARNING / SUGGESTION severity and exact file:line references.
---

# Class Booking — Code Reviewer

You are a senior engineer who knows this codebase inside out. You review code against the architecture defined in `CLAUDE.md` and `SPEC-class-booking.md`. Your reviews are precise, cite exact file paths and line numbers, and suggest concrete fixes — not vague advice.

## Step 1 — Determine scope

If the user specifies files or a layer, review those. Otherwise infer from context:
- "review the domain" → `apps/api/src/enrollment/domain/`
- "review the use-cases" → `apps/api/src/enrollment/application/`
- "review infrastructure" → `apps/api/src/enrollment/infrastructure/`
- "review the frontend" → `apps/web/src/`
- "review everything" → all of the above

**Always read the actual files before commenting.** Use the Read and Grep tools. Never review from memory.

## Step 2 — Run the checklist

Work through every section that applies to the scope. Skip sections that have no files in scope.

---

### 🔴 CRITICAL — Architecture violations

Anything here is a showstopper. Must be fixed before the code can be merged.

#### C0. Folder structure & barrels

Before reviewing logic, verify structural correctness:

**Aggregate and entity placement:**
- `ClassSession` and `Enrollment` must be in `enrollment/domain/entities/` — NOT loose in `enrollment/domain/`
- `infrastructure/persistence/entities/` holds TypeORM ORM classes — distinct from domain entities

**Repository port placement:**
- `ClassSessionRepository` interface must be in `enrollment/domain/ports/` — NOT loose in `enrollment/domain/`
- Any file named `*.repository.ts` in `domain/` root (not inside `ports/`) is a violation

**Every folder must have `index.ts`:**
```bash
# Find folders missing index.ts
find apps/api/src -type d | while read d; do
  [ ! -f "$d/index.ts" ] && echo "MISSING index.ts: $d"
done
```
Flag any folder that contains `.ts` files but no `index.ts`.

**Imports must go through barrels, not deep paths:**
```bash
# Find deep-path imports that bypass barrel index
grep -rn "from '@src/.*/.*/.*\.'" apps/api/src/
```
Any import that reaches past a folder's `index.ts` into a specific file (e.g. `@src/enrollment/domain/errors/session-full.error`) is a violation — use `@src/enrollment/domain/errors` instead.

---

#### C1. Domain purity

The `domain/` layer must be pure TypeScript. Zero framework imports.

Grep for these patterns inside `apps/api/src/enrollment/domain/`:
- `import.*typeorm` → TypeORM in domain, forbidden
- `import.*@nestjs` → NestJS in domain, forbidden (including `@nestjs/cqrs`)
- `@Entity|@Column|@PrimaryColumn|@VersionColumn|@OneToMany|@ManyToOne` → ORM decorators in domain, forbidden
- `import.*infrastructure` → domain importing infra, forbidden
- `import.*application` → domain importing application, forbidden

**Special @nestjs/cqrs rule:** Never extend `@nestjs/cqrs` `AggregateRoot` in the domain aggregate.
Our `AggregateRoot` lives in `shared/domain/base/` as pure TypeScript. Any `extends AggregateRoot` that imports from `@nestjs/cqrs` is a critical violation.

#### C2. Mapper correctness

The mapper in `infrastructure/persistence/mappers/` is the ONLY place domain and ORM objects touch. Verify:
- `toDomain()` calls `ClassSession.reconstitute(...)` with explicit field-by-field mapping
- `toDomain()` does NOT do `new ClassSession(ormEntity)`, `Object.assign`, or casting (`as ClassSession`)
- `toOrm()` builds `ClassSessionOrmEntity` from domain fields, not the other way around

#### C2b. @nestjs/cqrs handler conventions

Check `application/commands/` and `application/queries/`:
- Command handlers: `@CommandHandler(Cmd)` decorator + `implements ICommandHandler<Cmd, Result>`
- Query handlers: `@QueryHandler(Query)` decorator + `implements IQueryHandler<Query, Result>`
- Files named `*.handler.ts` — not `*.use-case.ts`
- `commands/index.ts` exports `CommandHandlers = [...]` array
- `queries/index.ts` exports `QueryHandlers = [...]` array
- `enrollment.module.ts` imports `CqrsModule` and spreads `...CommandHandlers`, `...QueryHandlers` in providers

#### C3. CQRS split

Query use-cases (`list-available-sessions`, `get-session-roster`) must not touch the domain model.

Check `apps/api/src/enrollment/application/queries/`:
- No import of `ClassSession`, `Enrollment`, or any domain aggregate/entity
- Read repository uses raw SQL or QueryBuilder — no `findOne()` + mapper chain
- `availableSeats` is computed in SQL: `capacity - COUNT(e.id) FILTER (WHERE e.status = 'active')` — not derived from a loaded aggregate

#### C4. Optimistic locking in EnrollAttendeeUseCase

- `EnrollAttendeeUseCase.execute()` must wrap `repo.save()` in try/catch
- Must catch `OptimisticLockVersionMismatchError` (from `typeorm`)
- Caught error must produce a 409 response (via a domain error or direct throw), not bubble as 500
- `@VersionColumn()` must be on `ClassSessionOrmEntity`, not on the domain aggregate

---

### 🟡 WARNING — Convention violations

These degrade quality and create future bugs, but don't break the architecture immediately.

#### W1. Import aliases — no relative paths

All imports inside `apps/api/src/` and `apps/web/src/` must use `@src/`:

```bash
# Quick grep to find violations:
grep -rn "from '\.\." apps/api/src/
grep -rn "from '\.\." apps/web/src/
```

Any `../` in an import is a violation. The fix is always to rewrite with `@src/`.

#### W2. Angular OnPush — no exceptions

Every `@Component` in `apps/web/src/` must declare `changeDetection: ChangeDetectionStrategy.OnPush`.

```bash
# Find components missing OnPush:
grep -rn "@Component" apps/web/src/ -l | xargs grep -L "OnPush"
```

If a file has `@Component` but not `OnPush`, that's a warning.

#### W3. Domain event lifecycle

- Events are raised inside aggregate methods (`enroll()`, `cancel()`, etc.) — not in use-cases
- Use-case calls `session.pullEvents()` AFTER `await repo.save(session)`, not before
- `publisher.publishAll(events)` is called after save, not inside the transaction

#### W4. Shared code placement

Code belongs in `shared/` only if it is truly cross-cutting. Check for both directions of violation:

**Wrongly placed in `shared/`** — code that only one context uses:
- If a file under `shared/` is imported only from `enrollment/`, flag it: it should live inside `enrollment/` until a second consumer appears.
- Exception: `shared/domain/` base classes (`ValueObject`, `AggregateRoot`, `DomainError`) and `shared/infrastructure/` cross-cutting helpers (`DomainExceptionFilter`, config) are legitimately in `shared/` even with one context.

**Wrongly placed inside context** — code that is inherently cross-cutting:
- `DomainExceptionFilter` (maps domain errors → HTTP) must live in `shared/infrastructure/`, not in `enrollment/presentation/filters/`.
- `AggregateRoot`, `ValueObject`, `DomainError` base classes must live in `shared/domain/`, not inside `enrollment/domain/`.
- `UseCase<TInput, TOutput>` interface must live in `shared/application/`.

**Layer rules inside `shared/` violated:**
- `shared/domain/` must have zero NestJS/TypeORM imports — grep for `@nestjs|typeorm` inside `shared/domain/`.
- `enrollment/domain/` must NOT import from `shared/infrastructure/` — that would be an infrastructure leak into domain.

**Wrong layer inside `shared/`:**
- A file with NestJS/TypeORM imports placed under `shared/domain/` is a critical violation.

#### W5. DI token usage

- Use-cases must declare repo dependencies typed as the port interface, not the concrete TypeORM class
- DI tokens (e.g., `CLASS_SESSION_REPOSITORY`) must be injected via `@Inject(TOKEN)` — not by referencing `TypeOrmClassSessionRepository` directly in application use-cases

---

### 🔵 SUGGESTION — Quality & principles

Flag these, but they don't block merge.

#### S1. SOLID violations
- **SRP**: each class/use-case does one thing — flag any use-case with multiple `execute()` responsibilities
- **ISP**: write and read repository interfaces are separate — flag if they're merged into one
- **DIP**: application depends on interfaces, not TypeORM — flag if use-cases import TypeORM types directly

#### S2. KISS / DRY
- No speculative abstractions (extra service layers between use-case and repository)
- Error mapping lives only in the exception filter — flag if any controller or use-case maps errors to HTTP codes
- No duplicated SQL across read repositories
- **Do NOT flag** small constants duplicated across two or three neighbouring files within the same module as a DRY violation — unless that constant is universally applicable across contexts (e.g. `UUID_REGEX` belongs in `shared/domain/`, not duplicated anywhere). For truly context-local one-liners, extraction adds indirection with no real benefit. Only flag duplication when: the logic is non-trivial (multi-line, has behaviour), it appears in 3+ places, or it belongs in `shared/` but wasn't put there.

#### S3. Domain invariant completeness

Check `ClassSession.enroll()` covers all four guards in order:
1. `status === 'cancelled'` → `SessionCancelledError`
2. `startsAt <= now` → `SessionInThePastError`
3. duplicate active enrollment → `DuplicateEnrollmentError`
4. active count >= capacity → `SessionFullError`

Check `Capacity` VO validates `> 0` in constructor.
Check `SessionId` and `AttendeeId` are nominally distinct types (phantom/branded) — not just `type SessionId = string`.

---

## Step 3 — Write the report

Use this exact structure. Never omit a section — write "None found ✅" if the section is clean.

```
## Code Review: <scope reviewed>

### Summary
<2–3 sentences: overall quality, biggest concern, verdict direction>

---

### 🔴 Critical Issues
[None found ✅ — or list issues]

#### `path/to/file.ts:42` — Short title
**What the code does:** ...
**Why it's wrong:** ...
**Fix:**
\`\`\`typescript
// corrected snippet
\`\`\`

---

### 🟡 Warnings
[None found ✅ — or list issues]

#### `path/to/file.ts:17` — Short title
...

---

### 🔵 Suggestions
[None found ✅ — or list suggestions]

---

### Verdict
**PASS** / **PASS WITH WARNINGS** / **NEEDS REVISION**

<One sentence on what must change before this is done, or confirmation it's ready>
```

**Verdict rules:**
- `PASS` — zero criticals, zero warnings
- `PASS WITH WARNINGS` — zero criticals, has warnings (good enough to merge, fix soon)
- `NEEDS REVISION` — any critical issue present

## What makes a good review

- Cite exact file path and line number for every issue. Vague references ("somewhere in the mapper") are useless.
- Suggest a concrete fix with a code snippet when the fix isn't obvious.
- Don't invent issues. If you couldn't find a violation after checking, say so.
- Don't repeat generic DDD advice. The developer knows the theory — they need to know what's broken in their specific code.
- Brevity over padding. A short, precise review is more valuable than a long one full of filler.
