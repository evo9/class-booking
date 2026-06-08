import { Command } from '@nestjs/cqrs';

export class CancelSessionCommand extends Command<void> {
  constructor(public readonly sessionId: string) {
    super();
  }
}
