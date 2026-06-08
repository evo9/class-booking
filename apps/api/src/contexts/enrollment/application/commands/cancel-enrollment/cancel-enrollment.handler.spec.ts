import 'reflect-metadata';
import { EventBus } from '@nestjs/cqrs';
import { ClassSession } from '@src/contexts/enrollment/domain/entities';
import { ClassSessionRepository } from '@src/contexts/enrollment/domain/ports';
import {
  SessionNotFoundError,
  EnrollmentNotFoundError,
} from '@src/contexts/enrollment/domain/errors';
import {
  AttendeeId,
  Capacity,
  SessionId,
} from '@src/contexts/enrollment/domain/value-objects';
import { EnrollmentCancelledEvent } from '@src/contexts/enrollment/domain/events';
import { CancelEnrollmentCommand } from './cancel-enrollment.command';
import { CancelEnrollmentHandler } from './cancel-enrollment.handler';

function makeSessionWithEnrollee(): {
  session: ClassSession;
  attendeeId: AttendeeId;
} {
  const session = ClassSession.schedule({
    id: SessionId.create(),
    title: 'Yoga',
    startsAt: new Date(Date.now() + 60_000),
    capacity: new Capacity(10),
  });
  const attendeeId = AttendeeId.create();
  session.enroll(attendeeId);
  session.pullEvents();
  return { session, attendeeId };
}

describe('CancelEnrollmentHandler', () => {
  let repo: jest.Mocked<ClassSessionRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let handler: CancelEnrollmentHandler;

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      nextId: jest.fn(),
    };
    eventBus = { publishAll: jest.fn() } as any;
    handler = new CancelEnrollmentHandler(repo, eventBus);
  });

  it('throws SessionNotFoundError when session does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new CancelEnrollmentCommand(
          SessionId.create().value,
          AttendeeId.create().value,
        ),
      ),
    ).rejects.toThrow(SessionNotFoundError);
  });

  it("throws EnrollmentNotFoundError when attendee tries to cancel another attendee's enrollment", async () => {
    const { session } = makeSessionWithEnrollee();
    repo.findById.mockResolvedValue(session);
    const otherAttendeeId = AttendeeId.create();

    await expect(
      handler.execute(
        new CancelEnrollmentCommand(session.id.value, otherAttendeeId.value),
      ),
    ).rejects.toThrow(EnrollmentNotFoundError);
  });

  it('propagates EnrollmentNotFoundError from domain', async () => {
    const session = ClassSession.schedule({
      id: SessionId.create(),
      title: 'Yoga',
      startsAt: new Date(Date.now() + 60_000),
      capacity: new Capacity(10),
    });
    session.pullEvents();
    repo.findById.mockResolvedValue(session);

    await expect(
      handler.execute(
        new CancelEnrollmentCommand(
          session.id.value,
          AttendeeId.create().value,
        ),
      ),
    ).rejects.toThrow(EnrollmentNotFoundError);
  });

  it('publishes EnrollmentCancelledEvent on success', async () => {
    const { session, attendeeId } = makeSessionWithEnrollee();
    repo.findById.mockResolvedValue(session);
    const capturedEvents: unknown[] = [];
    eventBus.publishAll.mockImplementation((events: unknown[]) => {
      capturedEvents.push(...events);
    });

    await handler.execute(
      new CancelEnrollmentCommand(session.id.value, attendeeId.value),
    );

    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0]).toBeInstanceOf(EnrollmentCancelledEvent);
  });
});
