import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DomainExceptionFilter } from '@src/shared/presentation/filters';
import { AppModule } from '@src/app.module';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');

export const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
export const ATTENDEE_ID = '00000000-0000-0000-0000-000000000002';

export function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

export async function buildApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new DomainExceptionFilter());
  await app.init();
  const dataSource = moduleRef.get<DataSource>(getDataSourceToken());
  return { app, dataSource };
}

export function adminReq(app: INestApplication, actorId = ADMIN_ID) {
  const server = app.getHttpServer();
  return {
    get: (path: string) =>
      request(server)
        .get(path)
        .set('x-actor-id', actorId)
        .set('x-actor-role', 'admin'),
    post: (path: string) =>
      request(server)
        .post(path)
        .set('x-actor-id', actorId)
        .set('x-actor-role', 'admin'),
  };
}

export function attendeeReq(app: INestApplication, actorId = ATTENDEE_ID) {
  const server = app.getHttpServer();
  return {
    post: (path: string) =>
      request(server)
        .post(path)
        .set('x-actor-id', actorId)
        .set('x-actor-role', 'attendee'),
    delete: (path: string) =>
      request(server)
        .delete(path)
        .set('x-actor-id', actorId)
        .set('x-actor-role', 'attendee'),
  };
}
