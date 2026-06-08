import { Command } from '@nestjs/cqrs';

export class ScheduleSessionCommand extends Command<{ sessionId: string }> {
  constructor(
    public readonly title: string,
    public readonly startsAt: Date,
    public readonly capacity: number,
  ) {
    super();
  }
}
