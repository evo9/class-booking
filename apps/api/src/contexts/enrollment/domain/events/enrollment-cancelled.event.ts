import {
  AttendeeId,
  SessionId,
} from '@src/contexts/enrollment/domain/value-objects';

export class EnrollmentCancelledEvent {
  constructor(
    public readonly sessionId: SessionId,
    public readonly attendeeId: AttendeeId,
  ) {}
}
