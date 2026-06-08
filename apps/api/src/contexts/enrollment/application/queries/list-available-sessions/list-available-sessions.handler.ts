import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  SESSION_READ_REPOSITORY,
  SessionReadRepository,
} from '@src/contexts/enrollment/application/ports';
import { ListAvailableSessionsQuery } from './list-available-sessions.query';

@QueryHandler(ListAvailableSessionsQuery)
export class ListAvailableSessionsHandler implements IQueryHandler<ListAvailableSessionsQuery> {
  constructor(
    @Inject(SESSION_READ_REPOSITORY)
    private readonly readRepo: SessionReadRepository,
  ) {}

  async execute(query: ListAvailableSessionsQuery) {
    return this.readRepo.listAvailableSessions(query.attendeeId);
  }
}
