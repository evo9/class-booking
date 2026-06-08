export type SessionStatus = "scheduled" | "cancelled";

export interface SessionListItemDto {
  id: string;
  title: string;
  startsAt: string; // ISO
  capacity: number;
  availableSeats: number;
  status: SessionStatus;
}

export interface ScheduleSessionRequestDto {
  title: string;
  startsAt: string;
  capacity: number;
}

export interface RosterEntryDto {
  attendeeId: string;
  displayName: string;
  enrolledAt: string;
}
