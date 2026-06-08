import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ClassSession } from '@src/contexts/enrollment/domain/entities';
import {
  CLASS_SESSION_REPOSITORY,
  ClassSessionRepository,
} from '@src/contexts/enrollment/domain/ports';
import { Capacity } from '@src/contexts/enrollment/domain/value-objects';
import { ScheduleSessionCommand } from './schedule-session.command';

@CommandHandler(ScheduleSessionCommand)
export class ScheduleSessionHandler implements ICommandHandler<ScheduleSessionCommand> {
  constructor(
    @Inject(CLASS_SESSION_REPOSITORY)
    private readonly repo: ClassSessionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: ScheduleSessionCommand) {
    const id = this.repo.nextId();
    const session = ClassSession.schedule({
      id,
      title: cmd.title,
      startsAt: cmd.startsAt,
      capacity: new Capacity(cmd.capacity),
    });
    await this.repo.save(session);
    this.eventBus.publishAll(session.pullEvents());
    return { sessionId: id.value };
  }
}
