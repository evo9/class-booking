import 'reflect-metadata';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { ClassSessionOrmEntity } from '@src/contexts/enrollment/infrastructure/persistence/typeorm/entities';
import { TypeOrmSessionReadRepository } from './typeorm-session-read.repository';

function makeQueryBuilder(
  rawResults: Record<string, unknown>[],
): Partial<SelectQueryBuilder<ClassSessionOrmEntity>> {
  const qb: any = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rawResults),
  };
  return qb;
}

describe('TypeOrmSessionReadRepository', () => {
  let ormRepo: jest.Mocked<
    Pick<Repository<ClassSessionOrmEntity>, 'createQueryBuilder'>
  >;
  let dataSource: jest.Mocked<Pick<DataSource, 'createQueryBuilder'>>;
  let repository: TypeOrmSessionReadRepository;

  beforeEach(() => {
    ormRepo = { createQueryBuilder: jest.fn() };
    dataSource = { createQueryBuilder: jest.fn() };
    repository = new TypeOrmSessionReadRepository(
      ormRepo as any,
      dataSource as any,
    );
  });

  describe('listAvailableSessions', () => {
    it('returns empty array when no sessions exist', async () => {
      ormRepo.createQueryBuilder.mockReturnValue(makeQueryBuilder([]) as any);

      const result = await repository.listAvailableSessions();

      expect(result).toEqual([]);
    });

    it('maps raw rows to SessionListItem with numeric availableSeats and isEnrolled', async () => {
      const startsAt = new Date('2030-06-01T10:00:00Z');
      ormRepo.createQueryBuilder.mockReturnValue(
        makeQueryBuilder([
          {
            id: 'session-uuid',
            title: 'Yoga',
            startsAt,
            capacity: 10,
            status: 'scheduled',
            availableSeats: '8',
            isEnrolled: false,
          },
        ]) as any,
      );

      const result = await repository.listAvailableSessions();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'session-uuid',
        title: 'Yoga',
        startsAt,
        capacity: 10,
        availableSeats: 8,
        status: 'scheduled',
        isEnrolled: false,
      });
    });

    it('passes attendeeId to query builder and maps isEnrolled true', async () => {
      const startsAt = new Date('2030-06-01T10:00:00Z');
      const qb = makeQueryBuilder([
        {
          id: 'session-uuid',
          title: 'Yoga',
          startsAt,
          capacity: 10,
          status: 'scheduled',
          availableSeats: '8',
          isEnrolled: true,
        },
      ]);
      ormRepo.createQueryBuilder.mockReturnValue(qb as any);

      const result = await repository.listAvailableSessions('att-uuid');

      expect(qb.setParameter).toHaveBeenCalledWith('attendeeId', 'att-uuid');
      expect(result[0].isEnrolled).toBe(true);
    });
  });

  describe('getSessionRoster', () => {
    it('returns empty array when no active enrollments', async () => {
      dataSource.createQueryBuilder.mockReturnValue(
        makeQueryBuilder([]) as any,
      );

      const result = await repository.getSessionRoster('session-uuid');

      expect(result).toEqual([]);
    });

    it('maps raw rows to RosterEntry with displayName from users JOIN', async () => {
      const enrolledAt = new Date('2030-05-01T09:00:00Z');
      dataSource.createQueryBuilder.mockReturnValue(
        makeQueryBuilder([
          {
            attendeeId: 'attendee-uuid',
            displayName: 'Alice',
            enrolledAt,
          },
        ]) as any,
      );

      const result = await repository.getSessionRoster('session-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        attendeeId: 'attendee-uuid',
        displayName: 'Alice',
        enrolledAt,
      });
    });
  });
});
