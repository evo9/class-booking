import { Command } from '@nestjs/cqrs';

export class EnrollAttendeeCommand extends Command<void> {
  constructor(
    public readonly sessionId: string,
    public readonly attendeeId: string,
  ) {
    super();
  }
}
