import { DomainError } from '@src/shared/domain';

export class InvalidEmailError extends DomainError {
  readonly statusCode = 422;

  constructor(value: string) {
    super(`Invalid email: "${value}"`);
  }
}

export class Email {
  private static readonly REGEX = /.+@.+\..+/;

  constructor(readonly value: string) {
    if (!Email.REGEX.test(value)) {
      throw new InvalidEmailError(value);
    }
  }
}
