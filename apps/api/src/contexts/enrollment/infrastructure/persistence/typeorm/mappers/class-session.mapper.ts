import {
  ClassSession,
  Enrollment,
} from '@src/contexts/enrollment/domain/entities';
import {
  AttendeeId,
  Capacity,
  EnrollmentStatus,
  SessionId,
  SessionStatus,
} from '@src/contexts/enrollment/domain/value-objects';
import {
  ClassSessionOrmEntity,
  EnrollmentOrmEntity,
} from '@src/contexts/enrollment/infrastructure/persistence/typeorm/entities';

export class ClassSessionMapper {
  static toDomain(orm: ClassSessionOrmEntity): ClassSession {
    return ClassSession.reconstitute({
      id: SessionId.fromString(orm.id),
      title: orm.title,
      startsAt: orm.startsAt,
      capacity: new Capacity(orm.capacity),
      status: orm.status as SessionStatus,
      enrollments: orm.enrollments.map(ClassSessionMapper.enrollmentToDomain),
      version: orm.version,
    });
  }

  static toOrm(domain: ClassSession): ClassSessionOrmEntity {
    const orm = new ClassSessionOrmEntity();
    orm.id = domain.id.value;
    orm.title = domain.title;
    orm.startsAt = domain.startsAt;
    orm.capacity = domain.capacity.value;
    orm.status = domain.status;
    orm.version = domain.version;
    orm.enrollments = domain
      .getEnrollments()
      .map(ClassSessionMapper.enrollmentToOrm);
    return orm;
  }

  private static enrollmentToDomain(orm: EnrollmentOrmEntity): Enrollment {
    return new Enrollment({
      id: orm.id, // preserve DB id — TypeORM needs it to UPDATE not INSERT
      attendeeId: AttendeeId.fromString(orm.attendeeId),
      enrolledAt: orm.enrolledAt,
      status: orm.status as EnrollmentStatus,
    });
  }

  private static enrollmentToOrm(enrollment: Enrollment): EnrollmentOrmEntity {
    const orm = new EnrollmentOrmEntity();
    orm.id = enrollment.id; // must be set — without it TypeORM inserts a duplicate row
    orm.attendeeId = enrollment.attendeeId.value;
    orm.enrolledAt = enrollment.enrolledAt;
    orm.status = enrollment.status;
    return orm;
  }
}
