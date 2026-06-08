import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassSession } from '@src/contexts/enrollment/domain/entities';
import { ClassSessionRepository } from '@src/contexts/enrollment/domain/ports';
import { SessionId } from '@src/contexts/enrollment/domain/value-objects';
import { ClassSessionOrmEntity } from '@src/contexts/enrollment/infrastructure/persistence/typeorm/entities';
import { ClassSessionMapper } from '@src/contexts/enrollment/infrastructure/persistence/typeorm/mappers';

@Injectable()
export class TypeOrmClassSessionRepository implements ClassSessionRepository {
  constructor(
    @InjectRepository(ClassSessionOrmEntity)
    private readonly repo: Repository<ClassSessionOrmEntity>,
  ) {}

  async findById(id: SessionId): Promise<ClassSession | null> {
    const orm = await this.repo.findOne({
      where: { id: id.value },
      relations: { enrollments: true },
    });
    return orm ? ClassSessionMapper.toDomain(orm) : null;
  }

  async save(session: ClassSession): Promise<void> {
    const orm = ClassSessionMapper.toOrm(session);
    await this.repo.save(orm);
  }

  nextId(): SessionId {
    return SessionId.create();
  }
}
