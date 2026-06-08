import { Query } from '@nestjs/cqrs';
import { RosterEntry } from '@src/contexts/enrollment/application/ports';

export class GetSessionRosterQuery extends Query<RosterEntry[]> {
  constructor(public readonly sessionId: string) {
    super();
  }
}
