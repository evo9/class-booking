import { AggregateRoot } from '@src/shared/domain';

import { Enrollment } from './enrollment.entity';
import {
  AttendeeId,
  Capacity,
  SessionId,
  SessionStatus,
} from '@src/contexts/enrollment/domain/value-objects';
import {
  DuplicateEnrollmentError,
  EnrollmentNotFoundError,
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

export interface ClassSessionProps {
  id: SessionId;
  title: string;
  startsAt: Date;
  capacity: Capacity;
  status: SessionStatus;
  enrollments: Enrollment[];
  version: number;
}

export class ClassSession extends AggregateRoot {
  readonly id: SessionId;
  readonly title: string;
  readonly startsAt: Date;
  readonly capacity: Capacity;
  status: SessionStatus;
  private readonly enrollments: Enrollment[];
  version: number;

  private constructor(props: ClassSessionProps) {
    super();
    this.id = props.id;
    this.title = props.title;
    this.startsAt = props.startsAt;
    this.capacity = props.capacity;
    this.status = props.status;
    this.enrollments = props.enrollments;
    this.version = props.version;
  }

  static schedule(props: {
    id: SessionId;
    title: string;
    startsAt: Date;
    capacity: Capacity;
  }): ClassSession {
    if (props.startsAt <= new Date()) {
      throw new SessionInThePastError();
    }

    const session = new ClassSession({
      ...props,
      status: 'scheduled',
      enrollments: [],
      version: 0,
    });
    session.raise(
      new SessionScheduledEvent(
        session.id,
        session.title,
        session.startsAt,
        session.capacity,
      ),
    );
    return session;
  }

  static reconstitute(props: ClassSessionProps): ClassSession {
    return new ClassSession(props);
  }

  enroll(attendeeId: AttendeeId): void {
    if (this.status === 'cancelled') throw new SessionCancelledError();
    if (this.startsAt <= new Date()) throw new SessionInThePastError();

    const active = this.activeEnrollments();
    if (active.some((e) => e.attendeeId.value === attendeeId.value)) {
      throw new DuplicateEnrollmentError();
    }
    if (active.length >= this.capacity.value) throw new SessionFullError();

    const enrollment = new Enrollment({
      attendeeId,
      enrolledAt: new Date(),
      status: 'active',
    });
    this.enrollments.push(enrollment);
    this.raise(
      new AttendeeEnrolledEvent(this.id, attendeeId, enrollment.enrolledAt),
    );
  }

  cancelEnrollment(attendeeId: AttendeeId): void {
    const enrollment = this.activeEnrollments().find(
      (e) => e.attendeeId.value === attendeeId.value,
    );
    if (!enrollment) throw new EnrollmentNotFoundError();

    enrollment.cancel();
    this.raise(new EnrollmentCancelledEvent(this.id, attendeeId));
  }

  cancel(): void {
    for (const enrollment of this.activeEnrollments()) {
      enrollment.cancel();
      this.raise(new EnrollmentCancelledEvent(this.id, enrollment.attendeeId));
    }
    this.status = 'cancelled';
    this.raise(new SessionCancelledEvent(this.id));
  }

  availableSeats(): number {
    return this.capacity.value - this.activeEnrollments().length;
  }

  getEnrollments(): readonly Enrollment[] {
    return this.enrollments;
  }

  private activeEnrollments(): Enrollment[] {
    return this.enrollments.filter((e) => e.status === 'active');
  }
}
