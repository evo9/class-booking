# Task 11 — Infrastructure: TypeORM Migrations

**Layer:** infrastructure  
**Depends on:** 08  
**Blocks:** 16 (integration tests)

## Goal

Generate and apply the initial database migration. `synchronize: false` everywhere — migrations only.

## TypeORM setup (already done by agent)

Config lives at `src/infrastructure/persistence/typeorm/`:
- `typeorm.config.ts` — shared factory using `ConfigService`
- `typeorm-cli.config.ts` — CLI entry point (uses dotenv + ConfigService)
- `typeorm.module.ts` — NestJS module wrapping TypeORM
- `migrations/` — generated migration files go here

`autoLoadEntities: true` — entities registered via `TypeOrmModule.forFeature()` are picked up automatically, no explicit list needed.

## Generate the initial migration

```bash
pnpm migration:diff
```

This generates a timestamped file in `src/infrastructure/persistence/typeorm/migrations/`.

## Verify the generated migration creates

```sql
CREATE TABLE class_sessions (
  id            uuid PRIMARY KEY,
  title         text NOT NULL,
  starts_at     timestamptz NOT NULL,
  capacity      int NOT NULL,
  status        text NOT NULL,
  version       int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE enrollments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES class_sessions(id),
  attendee_id   uuid NOT NULL,
  status        text NOT NULL,
  enrolled_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, attendee_id)
);
```

Column names are snake_case automatically via `SnakeNamingStrategy`.

## Apply the migration

```bash
pnpm db:up          # start PostgreSQL if not running
pnpm migration:migrate
```

## Other migration commands

```bash
pnpm migration:revert   # roll back last migration
pnpm migration:create   # create empty migration manually
```

## Notes

- `CHECK (capacity > 0)` is not generated from TypeORM — add manually to migration if needed.
- `UNIQUE (session_id, attendee_id)` should come from `@Unique` decorator on `EnrollmentOrmEntity`.
- Keep `synchronize: false` in all environments.
