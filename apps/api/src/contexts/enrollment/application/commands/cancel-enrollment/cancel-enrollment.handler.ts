import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  EnrollmentNotFoundError,
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
import { CancelEnrollmentCommand } from './cancel-enrollment.command';

@CommandHandler(CancelEnrollmentCommand)
export class CancelEnrollmentHandler implements ICommandHandler<CancelEnrollmentCommand> {
  constructor(
    @Inject(CLASS_SESSION_REPOSITORY)
    private readonly repo: ClassSessionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CancelEnrollmentCommand) {
    const session = await this.repo.findById(
      SessionId.fromString(cmd.sessionId),
    );
    if (!session) throw new SessionNotFoundError(cmd.sessionId);

    const owns = session
      .getEnrollments()
      .some(
        (e) => e.attendeeId.value === cmd.attendeeId && e.status === 'active',
      );
    if (!owns) throw new EnrollmentNotFoundError();

    session.cancelEnrollment(AttendeeId.fromString(cmd.attendeeId));
    await this.repo.save(session);
    this.eventBus.publishAll(session.pullEvents());
  }
}
