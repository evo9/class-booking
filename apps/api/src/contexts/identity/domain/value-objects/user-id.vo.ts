import { randomUUID } from 'crypto';

import { UUID_REGEX } from '@src/shared/domain/uuid';

export class UserId {
  declare private readonly _brand: 'UserId';

  constructor(readonly value: string) {}

  static create(): UserId {
    return new UserId(randomUUID());
  }

  static fromString(s: string): UserId {
    if (!UUID_REGEX.test(s)) {
      throw new Error(`Invalid UserId: "${s}" is not a valid UUID`);
    }
    return new UserId(s);
  }
}
