export type SessionStatus = "scheduled" | "cancelled";
export interface SessionListItemDto {
  id: string;
  title: string;
  startsAt: string;
  capacity: number;
  availableSeats: number;
  status: SessionStatus;
  isEnrolled: boolean;
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
