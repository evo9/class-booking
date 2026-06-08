import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import {
  SessionFullError,
  SessionNotFoundError,
} from '@src/contexts/enrollment/domain/errors';
import {
  CLASS_SESSION_REPOSITORY,
  ClassSessionRepository,
} from '@src/contexts/enrollment/domain/ports';
import {
  AttendeeId,
  SessionId,
} from '@src/contexts/enrollment/domain/value-objects';
import { EnrollAttendeeCommand } from './enroll-attendee.command';

@CommandHandler(EnrollAttendeeCommand)
export class EnrollAttendeeHandler implements ICommandHandler<EnrollAttendeeCommand> {
  constructor(
    @Inject(CLASS_SESSION_REPOSITORY)
    private readonly repo: ClassSessionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: EnrollAttendeeCommand) {
    const session = await this.repo.findById(
      SessionId.fromString(cmd.sessionId),
    );
    if (!session) throw new SessionNotFoundError(cmd.sessionId);

    session.enroll(AttendeeId.fromString(cmd.attendeeId));

    try {
      await this.repo.save(session);
    } catch (err) {
      if (err instanceof OptimisticLockVersionMismatchError)
        throw new SessionFullError();
      throw err;
    }

    this.eventBus.publishAll(session.pullEvents());
  }
}
