import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { adminReq, attendeeReq, buildApp, tomorrow } from './setup';

describe('Overbooking prevention (concurrency)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ app, dataSource } = await buildApp());
    await dataSource.query('TRUNCATE class_sessions CASCADE');
  });

  afterAll(async () => {
    await dataSource.query('TRUNCATE class_sessions CASCADE');
    await app.close();
  });

  it('allows exactly 1 enrollment when N parallel requests hit a capacity-1 session', async () => {
    const scheduleRes = await adminReq(app)
      .post('/sessions')
      .send({ title: 'Capacity-1 Session', startsAt: tomorrow(), capacity: 1 })
      .expect(201);
    const { sessionId } = scheduleRes.body as { sessionId: string };

    const N = 10;
    const statuses = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        attendeeReq(
          app,
          `00000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
        )
          .post(`/sessions/${sessionId}/enrollments`)
          .then((res) => res.status),
      ),
    );

    const successes = statuses.filter((s) => s === 201);
    const conflicts = statuses.filter((s) => s === 409);

    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(N - 1);

    const rosterRes = await adminReq(app)
      .get(`/sessions/${sessionId}/roster`)
      .expect(200);
    expect((rosterRes.body as unknown[]).length).toBe(1);
  });
});
