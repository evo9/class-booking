import { Command } from '@nestjs/cqrs';

export class CancelEnrollmentCommand extends Command<void> {
  constructor(
    public readonly sessionId: string,
    public readonly attendeeId: string,
  ) {
    super();
  }
}
