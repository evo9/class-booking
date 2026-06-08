import 'reflect-metadata';
import { EventBus } from '@nestjs/cqrs';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import { ClassSession } from '@src/contexts/enrollment/domain/entities';
import { ClassSessionRepository } from '@src/contexts/enrollment/domain/ports';
import {
  SessionNotFoundError,
  SessionFullError,
} from '@src/contexts/enrollment/domain/errors';
import {
  AttendeeId,
  Capacity,
  SessionId,
} from '@src/contexts/enrollment/domain/value-objects';
import { AttendeeEnrolledEvent } from '@src/contexts/enrollment/domain/events';
import { EnrollAttendeeCommand } from './enroll-attendee.command';
import { EnrollAttendeeHandler } from './enroll-attendee.handler';

function makeScheduledSession(capacity = 10): ClassSession {
  const session = ClassSession.schedule({
    id: SessionId.create(),
    title: 'Yoga',
    startsAt: new Date(Date.now() + 60_000),
    capacity: new Capacity(capacity),
  });
  session.pullEvents();
  return session;
}

describe('EnrollAttendeeHandler', () => {
  let repo: jest.Mocked<ClassSessionRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let handler: EnrollAttendeeHandler;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      nextId: jest.fn(),
    };
    eventBus = { publishAll: jest.fn() } as any;
    handler = new EnrollAttendeeHandler(repo, eventBus);
  });

  it('throws SessionNotFoundError when session does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new EnrollAttendeeCommand(
          SessionId.create().value,
          AttendeeId.create().value,
        ),
      ),
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('propagates domain errors from session.enroll()', async () => {
    const session = makeScheduledSession(1);
    session.enroll(AttendeeId.create());
    repo.findById.mockResolvedValue(session);

    await expect(
      handler.execute(
        new EnrollAttendeeCommand(session.id.value, AttendeeId.create().value),
      ),
    ).rejects.toThrow(SessionFullError);
  });

  it('rethrows OptimisticLockVersionMismatchError as SessionFullError', async () => {
    repo.findById.mockResolvedValue(makeScheduledSession());
    repo.save.mockRejectedValue(
      new OptimisticLockVersionMismatchError('ClassSession', 0, 1),
    );

    await expect(
      handler.execute(
        new EnrollAttendeeCommand(
          SessionId.create().value,
          AttendeeId.create().value,
        ),
      ),
    ).rejects.toThrow(SessionFullError);
  });

  it('publishes AttendeeEnrolledEvent on success', async () => {
    const session = makeScheduledSession();
    repo.findById.mockResolvedValue(session);
    const capturedEvents: unknown[] = [];
    eventBus.publishAll.mockImplementation((events: unknown[]) => {
      capturedEvents.push(...events);
    });

    await handler.execute(
      new EnrollAttendeeCommand(session.id.value, AttendeeId.create().value),
    );

    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0]).toBeInstanceOf(AttendeeEnrolledEvent);
  });
});
