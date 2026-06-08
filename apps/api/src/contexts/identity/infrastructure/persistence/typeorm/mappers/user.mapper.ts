import { User } from '@src/contexts/identity/domain/entities';
import {
  Email,
  UserId,
  UserRole,
} from '@src/contexts/identity/domain/value-objects';
import { UserOrmEntity } from '@src/contexts/identity/infrastructure/persistence/typeorm/entities';

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.reconstitute({
      id: UserId.fromString(orm.id),
      email: new Email(orm.email),
      passwordHash: orm.passwordHash,
      displayName: orm.displayName,
      role: orm.role as UserRole,
    });
  }

  static toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.id.value;
    orm.email = domain.email.value;
    orm.passwordHash = domain.passwordHash;
    orm.displayName = domain.displayName;
    orm.role = domain.role;
    return orm;
  }
}
