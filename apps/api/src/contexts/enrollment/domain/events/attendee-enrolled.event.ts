import {
  AttendeeId,
  SessionId,
} from '@src/contexts/enrollment/domain/value-objects';

export class AttendeeEnrolledEvent {
  constructor(
    public readonly sessionId: SessionId,
    public readonly attendeeId: AttendeeId,
    public readonly enrolledAt: Date,
  ) {}
}
