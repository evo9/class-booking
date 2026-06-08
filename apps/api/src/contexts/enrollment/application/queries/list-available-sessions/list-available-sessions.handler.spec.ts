import 'reflect-metadata';
import { SessionReadRepository } from '@src/contexts/enrollment/application/ports';
import { ListAvailableSessionsHandler } from './list-available-sessions.handler';
import { ListAvailableSessionsQuery } from './list-available-sessions.query';

describe('ListAvailableSessionsHandler', () => {
  let readRepo: jest.Mocked<SessionReadRepository>;
  let handler: ListAvailableSessionsHandler;

  beforeEach(() => {
    readRepo = {
      listAvailableSessions: jest.fn(),
      getSessionRoster: jest.fn(),
    };
    handler = new ListAvailableSessionsHandler(readRepo);
  });

  it('delegates to readRepo.listAvailableSessions()', async () => {
    const sessions = [
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        title: 'Yoga',
        startsAt: new Date('2030-01-01T10:00:00Z'),
        capacity: 20,
        availableSeats: 15,
        status: 'scheduled' as const,
        isEnrolled: false,
      },
    ];
    readRepo.listAvailableSessions.mockResolvedValue(sessions);

    const result = await handler.execute(new ListAvailableSessionsQuery());

    expect(readRepo.listAvailableSessions).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(sessions);
  });

  it('passes attendeeId from query to readRepo', async () => {
    readRepo.listAvailableSessions.mockResolvedValue([]);

    await handler.execute(new ListAvailableSessionsQuery('att-uuid'));

    expect(readRepo.listAvailableSessions).toHaveBeenCalledWith('att-uuid');
  });
});
