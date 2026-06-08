import { randomUUID } from 'crypto';

import { AttendeeId } from '@src/contexts/enrollment/domain/value-objects';
import { EnrollmentStatus } from '@src/contexts/enrollment/domain/value-objects';

export class Enrollment {
  readonly id: string;
  readonly attendeeId: AttendeeId;
  readonly enrolledAt: Date;
  status: EnrollmentStatus;

  constructor(props: {
    id?: string;
    attendeeId: AttendeeId;
    enrolledAt: Date;
    status: EnrollmentStatus;
  }) {
    this.id = props.id ?? randomUUID();
    this.attendeeId = props.attendeeId;
    this.enrolledAt = props.enrolledAt;
    this.status = props.status;
  }

  cancel(): void {
    this.status = 'cancelled';
  }
}
