# Task 09 — Infrastructure: Domain ↔ ORM Mapper

**Layer:** infrastructure  
**Depends on:** 02, 08  
**Blocks:** 10

## Goal

Write the mapper that converts between ORM entities and domain objects in both directions.
This is the ONLY place where TypeORM entities touch domain classes.

## File to create

`apps/api/src/enrollment/infrastructure/persistence/typeorm/mappers/class-session.mapper.ts`

```typescript
export class ClassSessionMapper {
  static toDomain(orm: ClassSessionOrmEntity): ClassSession { ... }
  static toOrm(domain: ClassSession): ClassSessionOrmEntity { ... }
}
```

### `toDomain(orm)`

- Reconstruct `ClassSession` using a private/static factory or a constructor that accepts raw props (avoid calling `ClassSession.schedule()` — that raises events and validates business rules you don't want to re-trigger on load).
- Map each `EnrollmentOrmEntity` → `Enrollment` entity.
- Pass `version` through.

### `toOrm(domain)`

- Map all fields to ORM entity.
- Map `domain.enrollments` → `EnrollmentOrmEntity[]`.
- Pass `version` through (TypeORM uses it for optimistic lock check on save).

## Common mistake to avoid

**WRONG:**
```typescript
// Assigning ORM entity directly to domain — defeats the entire separation
const session = orm as unknown as ClassSession;
```

**CORRECT:**
```typescript
const session = ClassSession.reconstitute({
  id: SessionId.fromString(orm.id),
  title: orm.title,
  startsAt: orm.startsAt,
  capacity: new Capacity(orm.capacity),
  status: orm.status as SessionStatus,
  enrollments: orm.enrollments.map(ClassSessionMapper.enrollmentToDomain),
  version: orm.version,
});
```

Implement a `ClassSession.reconstitute(props)` static method that bypasses business-rule validation (since data is already in DB) but does NOT raise events.
