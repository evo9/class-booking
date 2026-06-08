import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  SESSION_READ_REPOSITORY,
  SessionReadRepository,
} from '@src/contexts/enrollment/application/ports';
import { GetSessionRosterQuery } from './get-session-roster.query';

@QueryHandler(GetSessionRosterQuery)
export class GetSessionRosterHandler implements IQueryHandler<GetSessionRosterQuery> {
  constructor(
    @Inject(SESSION_READ_REPOSITORY)
    private readonly readRepo: SessionReadRepository,
  ) {}

  async execute(query: GetSessionRosterQuery) {
    return this.readRepo.getSessionRoster(query.sessionId);
  }
}
