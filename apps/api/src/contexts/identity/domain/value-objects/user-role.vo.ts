export type UserRole = 'admin' | 'attendee';

export const USER_ROLES = [
  'admin',
  'attendee',
] as const satisfies ReadonlyArray<UserRole>;
