import 'reflect-metadata';
import { SessionReadRepository } from '@src/contexts/enrollment/application/ports';
import { GetSessionRosterHandler } from './get-session-roster.handler';
import { GetSessionRosterQuery } from './get-session-roster.query';

describe('GetSessionRosterHandler', () => {
  let readRepo: jest.Mocked<SessionReadRepository>;
  let handler: GetSessionRosterHandler;

  beforeEach(() => {
    readRepo = {
      listAvailableSessions: jest.fn(),
      getSessionRoster: jest.fn(),
    };
    handler = new GetSessionRosterHandler(readRepo);
  });

  it('delegates to readRepo.getSessionRoster() with sessionId', async () => {
    const sessionId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const roster = [
      {
        attendeeId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        displayName: 'Alice',
        enrolledAt: new Date('2030-01-01T09:00:00Z'),
      },
    ];
    readRepo.getSessionRoster.mockResolvedValue(roster);

    const result = await handler.execute(new GetSessionRosterQuery(sessionId));

    expect(readRepo.getSessionRoster).toHaveBeenCalledWith(sessionId);
    expect(result).toEqual(roster);
  });
});
