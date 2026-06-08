import { DomainError } from '@src/shared/domain';

export class SessionNotFoundError extends DomainError {
  readonly statusCode = 404;
  constructor(id: string) {
    super(`Session not found: ${id}`);
  }
}
