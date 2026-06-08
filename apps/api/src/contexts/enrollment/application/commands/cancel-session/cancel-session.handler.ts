import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { SessionNotFoundError } from '@src/contexts/enrollment/domain/errors';
import {
  CLASS_SESSION_REPOSITORY,
  ClassSessionRepository,
} from '@src/contexts/enrollment/domain/ports';
import { SessionId } from '@src/contexts/enrollment/domain/value-objects';
import { CancelSessionCommand } from './cancel-session.command';

@CommandHandler(CancelSessionCommand)
export class CancelSessionHandler implements ICommandHandler<CancelSessionCommand> {
  constructor(
    @Inject(CLASS_SESSION_REPOSITORY)
    private readonly repo: ClassSessionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CancelSessionCommand) {
    const session = await this.repo.findById(
      SessionId.fromString(cmd.sessionId),
    );
    if (!session) throw new SessionNotFoundError(cmd.sessionId);

    session.cancel();
    await this.repo.save(session);
    this.eventBus.publishAll(session.pullEvents());
  }
}
