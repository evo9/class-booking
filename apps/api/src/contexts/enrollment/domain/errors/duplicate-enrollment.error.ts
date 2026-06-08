import { DomainError } from '@src/shared/domain';

export class DuplicateEnrollmentError extends DomainError {
  readonly statusCode = 409;
  constructor() {
    super('Attendee is already enrolled in this session');
  }
}
