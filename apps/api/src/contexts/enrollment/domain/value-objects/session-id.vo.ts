import { randomUUID } from 'crypto';

import { UUID_REGEX } from '@src/shared/domain/uuid';

export class SessionId {
  // Private field makes this nominally distinct from AttendeeId at the TypeScript level
  declare private readonly _brand: 'SessionId';

  constructor(readonly value: string) {}

  static create(): SessionId {
    return new SessionId(randomUUID());
  }

  static fromString(s: string): SessionId {
    if (!UUID_REGEX.test(s)) {
      throw new Error(`Invalid SessionId: "${s}" is not a valid UUID`);
    }
    return new SessionId(s);
  }
}
