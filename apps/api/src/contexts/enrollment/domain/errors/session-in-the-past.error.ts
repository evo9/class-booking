import { DomainError } from '@src/shared/domain';

export class SessionInThePastError extends DomainError {
  readonly statusCode = 422;
  constructor() {
    super('Session is in the past');
  }
}
