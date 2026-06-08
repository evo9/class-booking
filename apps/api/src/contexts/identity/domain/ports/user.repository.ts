import { User } from '@src/contexts/identity/domain/entities';
import { Email, UserId } from '@src/contexts/identity/domain/value-objects';

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
  nextId(): UserId;
}

export const USER_REPOSITORY = Symbol('UserRepository');
