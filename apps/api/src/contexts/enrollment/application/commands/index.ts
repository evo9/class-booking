export * from './cancel-enrollment';
export * from './cancel-session';
export * from './enroll-attendee';
export * from './schedule-session';

import { CancelEnrollmentHandler } from './cancel-enrollment';
import { CancelSessionHandler } from './cancel-session';
import { EnrollAttendeeHandler } from './enroll-attendee';
import { ScheduleSessionHandler } from './schedule-session';

export const CommandHandlers = [
  ScheduleSessionHandler,
  EnrollAttendeeHandler,
  CancelEnrollmentHandler,
  CancelSessionHandler,
];
