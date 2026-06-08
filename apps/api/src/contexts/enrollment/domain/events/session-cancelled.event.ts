import { SessionId } from '@src/contexts/enrollment/domain/value-objects';

export class SessionCancelledEvent {
  constructor(public readonly sessionId: SessionId) {}
}
