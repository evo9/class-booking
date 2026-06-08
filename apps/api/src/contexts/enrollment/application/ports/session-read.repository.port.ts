export const SESSION_READ_REPOSITORY = Symbol('SessionReadRepository');

export interface SessionListItem {
  id: string;
  title: string;
  startsAt: Date;
  capacity: number;
  availableSeats: number;
  status: 'scheduled' | 'cancelled';
  isEnrolled: boolean;
}

export interface RosterEntry {
  attendeeId: string;
  displayName: string;
  enrolledAt: Date;
}

export interface SessionReadRepository {
  listAvailableSessions(attendeeId?: string): Promise<SessionListItem[]>;
  getSessionRoster(sessionId: string): Promise<RosterEntry[]>;
}
