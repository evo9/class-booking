export type EnrollmentStatus = 'active' | 'cancelled';

export const ENROLLMENT_STATUSES = [
  'active',
  'cancelled',
] as const satisfies ReadonlyArray<EnrollmentStatus>;
