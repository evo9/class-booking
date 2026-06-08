import 'reflect-metadata';
import { EventBus } from '@nestjs/cqrs';
import { ClassSession } from '@src/contexts/enrollment/domain/entities';
import { ClassSessionRepository } from '@src/contexts/enrollment/domain/ports';
import { SessionNotFoundError } from '@src/contexts/enrollment/domain/errors';
import {
  AttendeeId,
  Capacity,
  SessionId,
} from '@src/contexts/enrollment/domain/value-objects';
import {
  SessionCancelledEvent,
  EnrollmentCancelledEvent,
} from '@src/contexts/enrollment/domain/events';
import { CancelSessionCommand } from './cancel-session.command';
import { CancelSessionHandler } from './cancel-session.handler';

function makeSessionWithEnrollees(count: number): ClassSession {
  const session = ClassSession.schedule({
    id: SessionId.create(),
    title: 'Yoga',
    startsAt: new Date(Date.now() + 60_000),
    capacity: new Capacity(count + 1),
  });
  for (let i = 0; i < count; i++) {
    session.enroll(AttendeeId.create());
  }
  session.pullEvents();
  return session;
}

describe('CancelSessionHandler', () => {
  let repo: jest.Mocked<ClassSessionRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let handler: CancelSessionHandler;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      nextId: jest.fn(),
    };
    eventBus = { publishAll: jest.fn() } as any;
    handler = new CancelSessionHandler(repo, eventBus);
  });

  it('throws SessionNotFoundError when session does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new CancelSessionCommand(SessionId.create().value)),
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('publishes SessionCancelledEvent on success', async () => {
    const session = makeSessionWithEnrollees(0);
    repo.findById.mockResolvedValue(session);
    const capturedEvents: unknown[] = [];
    eventBus.publishAll.mockImplementation((events: unknown[]) => {
      capturedEvents.push(...events);
    });

    await handler.execute(new CancelSessionCommand(session.id.value));

    expect(capturedEvents.some((e) => e instanceof SessionCancelledEvent)).toBe(
      true,
    );
  });

  it('publishes EnrollmentCancelledEvent for each active enrollee', async () => {
    const session = makeSessionWithEnrollees(2);
    repo.findById.mockResolvedValue(session);
    const capturedEvents: unknown[] = [];
    eventBus.publishAll.mockImplementation((events: unknown[]) => {
      capturedEvents.push(...events);
    });

    await handler.execute(new CancelSessionCommand(session.id.value));

    const cancelledEnrollments = capturedEvents.filter(
      (e) => e instanceof EnrollmentCancelledEvent,
    );
    expect(cancelledEnrollments).toHaveLength(2);
  });
});
