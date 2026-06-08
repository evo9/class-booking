import { randomUUID } from 'crypto';

import { UUID_REGEX } from '@src/shared/domain/uuid';

export class AttendeeId {
  declare private readonly _brand: 'AttendeeId';

  constructor(readonly value: string) {}

  static create(): AttendeeId {
    return new AttendeeId(randomUUID());
  }

  static fromString(s: string): AttendeeId {
    if (!UUID_REGEX.test(s)) {
      throw new Error(`Invalid AttendeeId: "${s}" is not a valid UUID`);
    }
    return new AttendeeId(s);
  }
}
