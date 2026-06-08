# Task 16 — Tests: Concurrency Test + E2E

**Layer:** test (infrastructure + e2e)  
**Depends on:** 10, 14, 15  
**Blocks:** nothing

## Goal

Write the flagship concurrency test and two e2e smoke tests.
These require a real PostgreSQL connection.

## Files to create

### Concurrency test (the flagship)

`apps/api/test/concurrency.e2e-spec.ts`

```typescript
describe('Overbooking prevention (concurrency)', () => {
  it('allows exactly 1 enrollment when N parallel requests hit a capacity-1 session', async () => {
    // 1. Create a session with capacity=1
    const sessionId = await createSession({ capacity: 1, startsAt: tomorrow() });

    // 2. Fire 10 parallel enroll requests with different attendee IDs
    const N = 10;
    const results = await Promise.allSettled(
      Array.from({ length: N }, (_, i) =>
        enrollAttendee(sessionId, `attendee-${i}`)
      )
    );

    // 3. Exactly one must succeed (201), rest must get 409
    const successes = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 201);
    const conflicts = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 409);

    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(N - 1);

    // 4. Verify DB state: exactly 1 active enrollment
    const roster = await getRoster(sessionId);
    expect(roster).toHaveLength(1);
  });
});
```

### E2E: happy-path enroll

`apps/api/test/sessions.e2e-spec.ts`

```typescript
describe('Sessions API (e2e)', () => {
  it('POST /sessions → GET /sessions → POST /sessions/:id/enrollments → GET /sessions/:id/roster', async () => {
    // Admin creates session
    const { sessionId } = await adminPost('/sessions', { title: 'Yoga', startsAt: tomorrow(), capacity: 5 });

    // List shows it with 5 seats
    const list = await get('/sessions');
    const session = list.find(s => s.id === sessionId);
    expect(session.availableSeats).toBe(5);

    // Attendee enrolls
    await attendeePost(`/sessions/${sessionId}/enrollments`);

    // Seat count drops
    const updated = await get('/sessions');
    expect(updated.find(s => s.id === sessionId).availableSeats).toBe(4);

    // Admin sees roster
    const roster = await adminGet(`/sessions/${sessionId}/roster`);
    expect(roster).toHaveLength(1);
  });

  it('returns 409 when session is full', async () => {
    const { sessionId } = await adminPost('/sessions', { title: 'Full Class', startsAt: tomorrow(), capacity: 1 });
    await attendeePost(`/sessions/${sessionId}/enrollments`, 'attendee-1');
    const res = await attendeePostRaw(`/sessions/${sessionId}/enrollments`, 'attendee-2');
    expect(res.status).toBe(409);
  });
});
```

## Setup

Use NestJS `supertest` + `@nestjs/testing`:

```typescript
beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();
});

afterAll(async () => {
  await dataSource.query('TRUNCATE class_sessions CASCADE');
  await app.close();
});
```

Requires PostgreSQL running (`pnpm db:up` before running `pnpm test:e2e`).
Set `DATABASE_URL` to test DB in `.env.test` or CI environment.
