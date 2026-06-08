import { ClassSession } from '@src/contexts/enrollment/domain/entities';
import { SessionId } from '@src/contexts/enrollment/domain/value-objects';

export const CLASS_SESSION_REPOSITORY = Symbol('ClassSessionRepository');

export interface ClassSessionRepository {
  findById(id: SessionId): Promise<ClassSession | null>;
  save(session: ClassSession): Promise<void>;
  nextId(): SessionId;
}
