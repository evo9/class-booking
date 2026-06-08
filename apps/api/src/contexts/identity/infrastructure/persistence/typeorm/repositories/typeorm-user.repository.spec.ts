import 'reflect-metadata';
import { Repository } from 'typeorm';
import { User } from '@src/contexts/identity/domain/entities';
import { Email, UserId } from '@src/contexts/identity/domain/value-objects';
import { UserOrmEntity } from '@src/contexts/identity/infrastructure/persistence/typeorm/entities';
import { TypeOrmUserRepository } from './typeorm-user.repository';

function makeOrmEntity(): UserOrmEntity {
  const orm = new UserOrmEntity();
  orm.id = '550e8400-e29b-41d4-a716-446655440000';
  orm.email = 'alice@example.com';
  orm.passwordHash = '$2b$10$hash';
  orm.displayName = 'Alice';
  orm.role = 'admin';
  orm.createdAt = new Date('2024-01-01');
  return orm;
}

describe('TypeOrmUserRepository', () => {
  let ormRepo: jest.Mocked<Repository<UserOrmEntity>>;
  let repository: TypeOrmUserRepository;

  beforeEach(() => {
    ormRepo = { findOne: jest.fn(), save: jest.fn() } as any;
    repository = new TypeOrmUserRepository(ormRepo);
  });

  describe('findByEmail', () => {
    it('returns null when user not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const email = new Email('nobody@example.com');

      const result = await repository.findByEmail(email);

      expect(result).toBeNull();
      expect(ormRepo.findOne).toHaveBeenCalledWith({
        where: { email: email.value },
      });
    });

    it('returns User mapped from ORM entity', async () => {
      const orm = makeOrmEntity();
      ormRepo.findOne.mockResolvedValue(orm);
      const email = new Email(orm.email);

      const result = await repository.findByEmail(email);

      expect(result).toBeInstanceOf(User);
      expect(result!.email.value).toBe(orm.email);
    });
  });

  describe('findById', () => {
    it('returns null when user not found', async () => {
      ormRepo.findOne.mockResolvedValue(null);
      const id = UserId.fromString('550e8400-e29b-41d4-a716-446655440000');

      const result = await repository.findById(id);

      expect(result).toBeNull();
      expect(ormRepo.findOne).toHaveBeenCalledWith({
        where: { id: id.value },
      });
    });

    it('returns User mapped from ORM entity', async () => {
      const orm = makeOrmEntity();
      ormRepo.findOne.mockResolvedValue(orm);
      const id = UserId.fromString(orm.id);

      const result = await repository.findById(id);

      expect(result).toBeInstanceOf(User);
      expect(result!.id.value).toBe(orm.id);
    });
  });

  describe('save', () => {
    it('maps domain User to ORM entity and persists it', async () => {
      ormRepo.save.mockResolvedValue(undefined as any);
      const user = User.reconstitute({
        id: UserId.fromString('550e8400-e29b-41d4-a716-446655440000'),
        email: new Email('alice@example.com'),
        passwordHash: '$2b$10$hash',
        displayName: 'Alice',
        role: 'admin',
      });

      await repository.save(user);

      expect(ormRepo.save).toHaveBeenCalledTimes(1);
      const saved = ormRepo.save.mock.calls[0][0] as UserOrmEntity;
      expect(saved).toBeInstanceOf(UserOrmEntity);
      expect(saved.id).toBe(user.id.value);
      expect(saved.email).toBe(user.email.value);
    });
  });

  describe('nextId', () => {
    it('returns a valid UUID-based UserId', () => {
      const id = repository.nextId();

      expect(id).toBeInstanceOf(UserId);
      expect(id.value).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });
  });
});
