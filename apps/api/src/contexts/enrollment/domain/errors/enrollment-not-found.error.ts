import { DomainError } from '@src/shared/domain';

export class EnrollmentNotFoundError extends DomainError {
  readonly statusCode = 404;
  constructor() {
    super('Enrollment not found');
  }
}
