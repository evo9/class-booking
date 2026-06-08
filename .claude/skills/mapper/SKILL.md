---
name: mapper
description: >
  Use when creating or editing the domain ↔ ORM mapper in infrastructure/persistence/mappers/.
  Triggers on: "write the mapper", "implement toDomain", "map ORM to domain", "create ClassSessionMapper",
  "mapper для", "написать маппер". This skill enforces the reconstitute pattern — the ONLY correct
  way to convert a TypeORM entity into a domain object in this project.
---

# Domain ↔ ORM Mapper

The mapper is the **only** place where TypeORM entities and domain objects touch.
It lives in `infrastructure/persistence/mappers/` and is the single bridge across the layer boundary.

## File location

```
enrollment/infrastructure/persistence/mappers/
  class-session.mapper.ts
  index.ts
```

## Two methods, nothing else

```typescript
export class ClassSessionMapper {
  static toDomain(orm: ClassSessionOrmEntity): ClassSession { ... }
  static toOrm(domain: ClassSession): ClassSessionOrmEntity { ... }
}
```

No extra methods. No constructor. Pure static.

---

## toDomain — the reconstitute pattern

**Always** use `ClassSession.reconstitute()`, never `new ClassSession()` or any casting.
`reconstitute()` bypasses business-rule validation (data is already persisted and valid)
and does NOT raise domain events.

```typescript
static toDomain(orm: ClassSessionOrmEntity): ClassSession {
  return ClassSession.reconstitute({
    id: SessionId.fromString(orm.id),
    title: orm.title,
    startsAt: orm.startsAt,
    capacity: new Capacity(orm.capacity),
    status: orm.status as SessionStatus,
    enrollments: orm.enrollments.map(ClassSessionMapper.enrollmentToDomain),
    version: orm.version,
  });
}

private static enrollmentToDomain(orm: EnrollmentOrmEntity): Enrollment {
  return new Enrollment({
    attendeeId: AttendeeId.fromString(orm.attendeeId),
    enrolledAt: orm.enrolledAt,
    status: orm.status as EnrollmentStatus,
  });
}
```

### Why reconstitute, not new or schedule?

| Method | When | Raises events? | Validates business rules? |
|--------|------|----------------|--------------------------|
| `ClassSession.schedule()` | Creating new session | ✅ Yes | ✅ Yes |
| `ClassSession.reconstitute()` | Loading from DB | ❌ No | ❌ No |
| `new ClassSession()` | Never externally | — | — |

Loading from DB must not re-trigger creation events or re-validate startsAt > now
(a past session is still a valid persisted session).

---

## toOrm — explicit field mapping

Map every field explicitly. Never `Object.assign`, never spread the domain object.

```typescript
static toOrm(domain: ClassSession): ClassSessionOrmEntity {
  const orm = new ClassSessionOrmEntity();
  orm.id = domain.id.value;
  orm.title = domain.title;
  orm.startsAt = domain.startsAt;
  orm.capacity = domain.capacity.value;
  orm.status = domain.status;
  orm.version = domain.version;
  orm.enrollments = domain.getEnrollments().map(ClassSessionMapper.enrollmentToOrm);
  return orm;
}

private static enrollmentToOrm(enrollment: Enrollment): EnrollmentOrmEntity {
  const orm = new EnrollmentOrmEntity();
  orm.attendeeId = enrollment.attendeeId.value;
  orm.enrolledAt = enrollment.enrolledAt;
  orm.status = enrollment.status;
  return orm;
}
```

**Pass `version` through.** TypeORM uses it for optimistic lock check on save.
If version is lost in the mapper, every save will conflict or skip the lock.

---

## What NOT to do

```typescript
// ❌ Direct cast — defeats the entire architecture
const session = orm as unknown as ClassSession;

// ❌ Object.assign — hidden field mapping, version may be lost
Object.assign(session, orm);

// ❌ new + schedule — re-raises events, re-validates business rules
const session = ClassSession.schedule({ ... });

// ❌ Importing mapper in domain layer
// domain/ must never import from infrastructure/
import { ClassSessionMapper } from '../infrastructure/persistence/mappers/class-session.mapper';
```

---

## Checklist before finishing

- [ ] `toDomain()` uses `ClassSession.reconstitute()` — not `new`, not `schedule()`
- [ ] Every field is mapped explicitly — no `Object.assign`, no spread
- [ ] `version` is passed through in both directions
- [ ] `enrollments` are mapped via a private helper
- [ ] Value Objects are reconstructed (`SessionId.fromString()`, `new Capacity()`)
- [ ] Status cast uses `as SessionStatus` / `as EnrollmentStatus` — not raw string
- [ ] No domain imports in ORM entity files; no TypeORM imports in domain files
- [ ] `index.ts` created/updated in `mappers/`
