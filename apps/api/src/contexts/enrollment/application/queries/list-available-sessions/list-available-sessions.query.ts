import { Query } from '@nestjs/cqrs';
import { SessionListItem } from '@src/contexts/enrollment/application/ports';

export class ListAvailableSessionsQuery extends Query<SessionListItem[]> {
  constructor(readonly attendeeId?: string) {
    super();
  }
}
