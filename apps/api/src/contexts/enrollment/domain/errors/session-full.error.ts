import { DomainError } from '@src/shared/domain';

export class SessionFullError extends DomainError {
  readonly statusCode = 409;
  constructor() {
    super('Session is full');
  }
}
