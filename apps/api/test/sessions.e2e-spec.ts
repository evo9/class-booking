import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { adminReq, attendeeReq, buildApp, tomorrow } from './setup';

describe('Sessions API (e2e)', () => {
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

  it('POST /sessions → GET /sessions → POST enrollments → GET roster (happy path)', async () => {
    const scheduleRes = await adminReq(app)
      .post('/sessions')
      .send({ title: 'Yoga', startsAt: tomorrow(), capacity: 5 })
      .expect(201);
    const { sessionId } = scheduleRes.body as { sessionId: string };

    const listRes = await adminReq(app).get('/sessions').expect(200);
    const session = (
      listRes.body as Array<{ id: string; availableSeats: number }>
    ).find((s) => s.id === sessionId);
    expect(session?.availableSeats).toBe(5);

    await attendeeReq(app)
      .post(`/sessions/${sessionId}/enrollments`)
      .expect(201);

    const updatedRes = await adminReq(app).get('/sessions').expect(200);
    const updated = (
      updatedRes.body as Array<{ id: string; availableSeats: number }>
    ).find((s) => s.id === sessionId);
    expect(updated?.availableSeats).toBe(4);

    const rosterRes = await adminReq(app)
      .get(`/sessions/${sessionId}/roster`)
      .expect(200);
    expect((rosterRes.body as unknown[]).length).toBe(1);
  });

  it('returns 409 when session is full', async () => {
    const scheduleRes = await adminReq(app)
      .post('/sessions')
      .send({ title: 'Full Class', startsAt: tomorrow(), capacity: 1 })
      .expect(201);
    const { sessionId } = scheduleRes.body as { sessionId: string };

    await attendeeReq(app, '00000000-0000-0000-0000-000000000011')
      .post(`/sessions/${sessionId}/enrollments`)
      .expect(201);

    await attendeeReq(app, '00000000-0000-0000-0000-000000000012')
      .post(`/sessions/${sessionId}/enrollments`)
      .expect(409);
  });
});
