import {
  AttendeeId,
  Capacity,
  SessionId,
} from '@src/contexts/enrollment/domain/value-objects';
import {
  DuplicateEnrollmentError,
  SessionCancelledError,
  SessionFullError,
  SessionInThePastError,
} from '@src/contexts/enrollment/domain/errors';
import {
  AttendeeEnrolledEvent,
  EnrollmentCancelledEvent,
  SessionCancelledEvent,
  SessionScheduledEvent,
} from '@src/contexts/enrollment/domain/events';

import { ClassSession } from './class-session.aggregate';

const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);

function makeSession(overrides?: { startsAt?: Date; capacity?: number }) {
  return ClassSession.schedule({
    id: SessionId.create(),
    title: 'Yoga',
    startsAt: overrides?.startsAt ?? future(),
    capacity: new Capacity(overrides?.capacity ?? 10),
  });
}

describe('ClassSession', () => {
  describe('schedule()', () => {
    it('creates a session with scheduled status', () => {
      const session = makeSession();
      expect(session.status).toBe('scheduled');
    });

    it('raises SessionScheduledEvent', () => {
      const session = makeSession();
      const events = session.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SessionScheduledEvent);
    });

    it('throws SessionInThePastError when startsAt is in the past', () => {
      expect(() => makeSession({ startsAt: past() })).toThrow(
        SessionInThePastError,
      );
    });
  });

  describe('enroll()', () => {
    it('enrolls an attendee successfully', () => {
      const session = makeSession({ capacity: 1 });
      session.pullEvents();

      session.enroll(AttendeeId.create());

      expect(session.availableSeats()).toBe(0);
    });

    it('raises AttendeeEnrolledEvent', () => {
      const session = makeSession();
      session.pullEvents();

      session.enroll(AttendeeId.create());

      const events = session.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AttendeeEnrolledEvent);
    });

    it('throws SessionFullError when capacity is exceeded', () => {
      const session = makeSession({ capacity: 1 });
      session.enroll(AttendeeId.create());

      expect(() => session.enroll(AttendeeId.create())).toThrow(
        SessionFullError,
      );
    });

    it('throws DuplicateEnrollmentError when attendee enrolls twice', () => {
      const session = makeSession();
      const attendee = AttendeeId.create();
      session.enroll(attendee);

      expect(() => session.enroll(attendee)).toThrow(DuplicateEnrollmentError);
    });

    it('throws SessionCancelledError when session is cancelled', () => {
      const session = makeSession();
      session.cancel();

      expect(() => session.enroll(AttendeeId.create())).toThrow(
        SessionCancelledError,
      );
    });

    it('throws SessionInThePastError when session is in the past', () => {
      const session = makeSession({ startsAt: new Date(Date.now() + 50) });
      jest.useFakeTimers();
      jest.setSystemTime(Date.now() + 100);

      try {
        expect(() => session.enroll(AttendeeId.create())).toThrow(
          SessionInThePastError,
        );
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('cancelEnrollment()', () => {
    it('cancels an active enrollment', () => {
      const session = makeSession({ capacity: 1 });
      const attendee = AttendeeId.create();
      session.enroll(attendee);
      session.pullEvents();

      session.cancelEnrollment(attendee);

      expect(session.availableSeats()).toBe(1);
    });

    it('raises EnrollmentCancelledEvent', () => {
      const session = makeSession();
      const attendee = AttendeeId.create();
      session.enroll(attendee);
      session.pullEvents();

      session.cancelEnrollment(attendee);

      const events = session.pullEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(EnrollmentCancelledEvent);
    });

    it('allows re-enroll after cancellation (seat freed)', () => {
      const session = makeSession({ capacity: 1 });
      const attendee = AttendeeId.create();
      session.enroll(attendee);
      session.cancelEnrollment(attendee);

      expect(() => session.enroll(attendee)).not.toThrow();
    });
  });

  describe('cancel()', () => {
    it('sets session status to cancelled', () => {
      const session = makeSession();
      session.cancel();
      expect(session.status).toBe('cancelled');
    });

    it('cancels all active enrollments', () => {
      const session = makeSession({ capacity: 3 });
      session.enroll(AttendeeId.create());
      session.enroll(AttendeeId.create());
      session.pullEvents();

      session.cancel();

      expect(session.availableSeats()).toBe(3);
    });

    it('raises SessionCancelledEvent', () => {
      const session = makeSession();
      session.pullEvents();

      session.cancel();

      const events = session.pullEvents();
      expect(events.some((e) => e instanceof SessionCancelledEvent)).toBe(true);
    });

    it('raises EnrollmentCancelledEvent for each active enrollment', () => {
      const session = makeSession({ capacity: 2 });
      session.enroll(AttendeeId.create());
      session.enroll(AttendeeId.create());
      session.pullEvents();

      session.cancel();

      const events = session.pullEvents();
      const cancelledEvents = events.filter(
        (e) => e instanceof EnrollmentCancelledEvent,
      );
      expect(cancelledEvents).toHaveLength(2);
    });
  });

  describe('availableSeats()', () => {
    it('returns capacity minus active enrollments', () => {
      const session = makeSession({ capacity: 5 });
      session.enroll(AttendeeId.create());
      session.enroll(AttendeeId.create());
      expect(session.availableSeats()).toBe(3);
    });
  });

  describe('pullEvents()', () => {
    it('clears events after pulling', () => {
      const session = makeSession();
      session.pullEvents();
      expect(session.pullEvents()).toHaveLength(0);
    });
  });
});
