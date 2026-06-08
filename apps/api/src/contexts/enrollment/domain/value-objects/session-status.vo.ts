export type SessionStatus = 'scheduled' | 'cancelled';

export const SESSION_STATUSES = [
  'scheduled',
  'cancelled',
] as const satisfies ReadonlyArray<SessionStatus>;
