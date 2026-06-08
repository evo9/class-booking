import {
  Capacity,
  SessionId,
} from '@src/contexts/enrollment/domain/value-objects';

export class SessionScheduledEvent {
  constructor(
    public readonly sessionId: SessionId,
    public readonly title: string,
    public readonly startsAt: Date,
    public readonly capacity: Capacity,
  ) {}
}
