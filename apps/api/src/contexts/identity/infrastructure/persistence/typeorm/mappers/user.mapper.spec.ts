import 'reflect-metadata';
import { User } from '@src/contexts/identity/domain/entities';
import { Email, UserId } from '@src/contexts/identity/domain/value-objects';
import { UserOrmEntity } from '@src/contexts/identity/infrastructure/persistence/typeorm/entities';
import { UserMapper } from './user.mapper';

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

describe('UserMapper', () => {
  describe('toDomain', () => {
    it('maps ORM entity to User domain object', () => {
      const orm = makeOrmEntity();

      const user = UserMapper.toDomain(orm);

      expect(user).toBeInstanceOf(User);
      expect(user.id.value).toBe(orm.id);
      expect(user.email.value).toBe(orm.email);
      expect(user.passwordHash).toBe(orm.passwordHash);
      expect(user.displayName).toBe(orm.displayName);
      expect(user.role).toBe('admin');
    });
  });

  describe('toOrm', () => {
    it('maps User domain object to ORM entity', () => {
      const user = User.reconstitute({
        id: UserId.fromString('550e8400-e29b-41d4-a716-446655440000'),
        email: new Email('alice@example.com'),
        passwordHash: '$2b$10$hash',
        displayName: 'Alice',
        role: 'admin',
      });

      const orm = UserMapper.toOrm(user);

      expect(orm).toBeInstanceOf(UserOrmEntity);
      expect(orm.id).toBe(user.id.value);
      expect(orm.email).toBe(user.email.value);
      expect(orm.passwordHash).toBe(user.passwordHash);
      expect(orm.displayName).toBe(user.displayName);
      expect(orm.role).toBe('admin');
    });

    it('round-trips: toDomain(toOrm(user)) equals original', () => {
      const original = User.reconstitute({
        id: UserId.fromString('550e8400-e29b-41d4-a716-446655440000'),
        email: new Email('bob@example.com'),
        passwordHash: '$2b$10$xyz',
        displayName: 'Bob',
        role: 'attendee',
      });

      const roundTripped = UserMapper.toDomain(UserMapper.toOrm(original));

      expect(roundTripped.id.value).toBe(original.id.value);
      expect(roundTripped.email.value).toBe(original.email.value);
      expect(roundTripped.passwordHash).toBe(original.passwordHash);
      expect(roundTripped.displayName).toBe(original.displayName);
      expect(roundTripped.role).toBe(original.role);
    });
  });
});
