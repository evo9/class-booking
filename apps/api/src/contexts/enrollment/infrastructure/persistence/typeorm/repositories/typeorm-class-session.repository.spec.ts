import 'reflect-metadata';
import { OptimisticLockVersionMismatchError, Repository } from 'typeorm';
import { ClassSession } from '@src/contexts/enrollment/domain/entities';
import {
  Capacity,
  SessionId,
} from '@src/contexts/enrollment/domain/value-objects';
import { ClassSessionOrmEntity } from '@src/contexts/enrollment/infrastructure/persistence/typeorm/entities';
import { TypeOrmClassSessionRepository } from './typeorm-class-session.repository';

function makeOrmEntity(id = SessionId.create()): ClassSessionOrmEntity {
  const orm = new ClassSessionOrmEntity();
  orm.id = id.value;
  orm.title = 'Yoga';
  orm.startsAt = new Date(Date.now() + 60_000);
  orm.capacity = 10;
  orm.status = 'scheduled';
  orm.version = 1;
  orm.enrollments = [];
  return orm;
}

describe('TypeOrmClassSessionRepository', () => {
  let ormRepo: jest.Mocked<Repository<ClassSessionOrmEntity>>;
  let repository: TypeOrmClassSessionRepository;

  beforeEach(() => {
    ormRepo = { findOne: jest.fn(), save: jest.fn() } as any;
    repository = new TypeOrmClassSessionRepository(ormRepo);
  });

  describe('findById', () => {
    it('returns null when entity not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const id = SessionId.create();

      const result = await repository.findById(id);

      expect(result).toBeNull();
      expect(ormRepo.findOne).toHaveBeenCalledWith({
        where: { id: id.value },
        relations: { enrollments: true },
      });
    });

    it('returns the domain aggregate mapped from ORM entity', async () => {
      const id = SessionId.create();
      ormRepo.findOne.mockResolvedValue(makeOrmEntity(id));

      const result = await repository.findById(id);

      expect(result).toBeInstanceOf(ClassSession);
      expect(result!.id.value).toBe(id.value);
    });
  });

  describe('save', () => {
    it('maps domain aggregate to ORM entity and persists it', async () => {
      ormRepo.save.mockResolvedValue(undefined as any);
      const session = ClassSession.schedule({
        id: SessionId.create(),
        title: 'Yoga',
        startsAt: new Date(Date.now() + 60_000),
        capacity: new Capacity(10),
      });
      session.pullEvents();

      await repository.save(session);

      expect(ormRepo.save).toHaveBeenCalledTimes(1);
      const saved = ormRepo.save.mock.calls[0][0] as ClassSessionOrmEntity;
      expect(saved).toBeInstanceOf(ClassSessionOrmEntity);
      expect(saved.id).toBe(session.id.value);
      expect(saved.title).toBe('Yoga');
    });

    it('propagates OptimisticLockVersionMismatchError from TypeORM on stale version', async () => {
      // TypeORM throws this automatically when @VersionColumn detects a conflict
      // (UPDATE ... WHERE version = ? affects 0 rows)
      ormRepo.save.mockRejectedValue(
        new OptimisticLockVersionMismatchError('ClassSession', 0, 1),
      );
      const session = ClassSession.schedule({
        id: SessionId.create(),
        title: 'Yoga',
        startsAt: new Date(Date.now() + 60_000),
        capacity: new Capacity(10),
      });
      session.pullEvents();

      await expect(repository.save(session)).rejects.toBeInstanceOf(
        OptimisticLockVersionMismatchError,
      );
    });
  });

  describe('nextId', () => {
    it('returns a valid UUID-based SessionId', () => {
      const id = repository.nextId();

      expect(id).toBeInstanceOf(SessionId);
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });
  });
});
