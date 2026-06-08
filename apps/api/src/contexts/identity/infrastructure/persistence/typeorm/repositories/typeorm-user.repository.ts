import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@src/contexts/identity/domain/entities';
import { UserRepository } from '@src/contexts/identity/domain/ports';
import { Email, UserId } from '@src/contexts/identity/domain/value-objects';
import { UserOrmEntity } from '@src/contexts/identity/infrastructure/persistence/typeorm/entities';
import { UserMapper } from '@src/contexts/identity/infrastructure/persistence/typeorm/mappers';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repo: Repository<UserOrmEntity>,
  ) {}

  async findByEmail(email: Email): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email: email.value } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async findById(id: UserId): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { id: id.value } });
    return orm ? UserMapper.toDomain(orm) : null;
  }

  async save(user: User): Promise<void> {
    await this.repo.save(UserMapper.toOrm(user));
  }

  nextId(): UserId {
    return UserId.create();
  }
}
