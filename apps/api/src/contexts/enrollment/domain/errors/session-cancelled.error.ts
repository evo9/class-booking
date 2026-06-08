import { DomainError } from '@src/shared/domain';

export class SessionCancelledError extends DomainError {
  readonly statusCode = 409;
  constructor() {
    super('Session is cancelled');
  }
}
