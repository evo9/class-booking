import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CancelEnrollmentCommand } from '@src/contexts/enrollment/application/commands/cancel-enrollment';
import { CancelSessionCommand } from '@src/contexts/enrollment/application/commands/cancel-session';
import { EnrollAttendeeCommand } from '@src/contexts/enrollment/application/commands/enroll-attendee';
import { ScheduleSessionCommand } from '@src/contexts/enrollment/application/commands/schedule-session';
import { GetSessionRosterQuery } from '@src/contexts/enrollment/application/queries/get-session-roster';
import { ListAvailableSessionsQuery } from '@src/contexts/enrollment/application/queries/list-available-sessions';
import { ActorContext } from '@src/shared/presentation/types';
import { ScheduleSessionRequestDto } from '@src/contexts/enrollment/presentation/dto';
import { SessionsController } from './sessions.controller';

const startsAtDate = new Date('2030-01-15T10:00:00.000Z');
const enrolledAtDate = new Date('2025-06-01T08:00:00.000Z');

describe('SessionsController', () => {
  let controller: SessionsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    controller = new SessionsController(commandBus, queryBus);
  });

  describe('scheduleSession', () => {
    it('dispatches ScheduleSessionCommand and returns sessionId', async () => {
      commandBus.execute.mockResolvedValue({ sessionId: 'new-id' });
      const dto: ScheduleSessionRequestDto = {
        title: 'Yoga',
        startsAt: '2030-01-15T10:00:00.000Z',
        capacity: 10,
      };

      const result = await controller.scheduleSession(dto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new ScheduleSessionCommand(
          'Yoga',
          new Date('2030-01-15T10:00:00.000Z'),
          10,
        ),
      );
      expect(result).toEqual({ sessionId: 'new-id' });
    });
  });

  describe('listSessions', () => {
    it('maps startsAt Date to ISO string and passes actor id to query', async () => {
      queryBus.execute.mockResolvedValue([
        {
          id: 'sid',
          title: 'Yoga',
          startsAt: startsAtDate,
          capacity: 10,
          availableSeats: 5,
          status: 'scheduled',
          isEnrolled: false,
        },
      ]);
      const actor: ActorContext = { id: 'att-uuid', role: 'attendee' };

      const result = await controller.listSessions(actor);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new ListAvailableSessionsQuery('att-uuid'),
      );
      expect(result[0].startsAt).toBe('2030-01-15T10:00:00.000Z');
      expect(result[0].isEnrolled).toBe(false);
    });
  });

  describe('getRoster', () => {
    it('maps enrolledAt Date to ISO string', async () => {
      queryBus.execute.mockResolvedValue([
        { attendeeId: 'att-1', enrolledAt: enrolledAtDate },
      ]);

      const result = await controller.getRoster('sid');

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetSessionRosterQuery('sid'),
      );
      expect(result[0].enrolledAt).toBe('2025-06-01T08:00:00.000Z');
    });
  });

  describe('enroll', () => {
    it('dispatches EnrollAttendeeCommand with sessionId and actorId', async () => {
      commandBus.execute.mockResolvedValue(undefined);
      const actor: ActorContext = { id: 'att-uuid', role: 'attendee' };

      await controller.enroll('sess-uuid', actor);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new EnrollAttendeeCommand('sess-uuid', 'att-uuid'),
      );
    });
  });

  describe('cancelEnrollment', () => {
    it('dispatches CancelEnrollmentCommand with sessionId and actorId', async () => {
      commandBus.execute.mockResolvedValue(undefined);
      const actor: ActorContext = { id: 'att-uuid', role: 'attendee' };

      await controller.cancelEnrollment('sess-uuid', actor);

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CancelEnrollmentCommand('sess-uuid', 'att-uuid'),
      );
    });
  });

  describe('cancelSession', () => {
    it('dispatches CancelSessionCommand with sessionId', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.cancelSession('sess-uuid');

      expect(commandBus.execute).toHaveBeenCalledWith(
        new CancelSessionCommand('sess-uuid'),
      );
    });
  });
});
