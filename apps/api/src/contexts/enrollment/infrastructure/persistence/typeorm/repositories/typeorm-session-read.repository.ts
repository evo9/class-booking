import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  RosterEntry,
  SessionListItem,
  SessionReadRepository,
} from '@src/contexts/enrollment/application/ports';
import { ClassSessionOrmEntity } from '@src/contexts/enrollment/infrastructure/persistence/typeorm/entities';

@Injectable()
export class TypeOrmSessionReadRepository implements SessionReadRepository {
  constructor(
    @InjectRepository(ClassSessionOrmEntity)
    private readonly repo: Repository<ClassSessionOrmEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async listAvailableSessions(attendeeId?: string): Promise<SessionListItem[]> {
    const rows = await this.repo
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.title', 'title')
      .addSelect('s.startsAt', 'startsAt')
      .addSelect('s.capacity', 'capacity')
      .addSelect('s.status', 'status')
      .addSelect(
        `s.capacity - COUNT(e.id) FILTER (WHERE e.status = 'active')`,
        'availableSeats',
      )
      .addSelect(
        `CASE WHEN EXISTS (
          SELECT 1 FROM enrollments e2
          WHERE e2.session_id = s.id
            AND e2.attendee_id = :attendeeId
            AND e2.status = 'active'
        ) THEN true ELSE false END`,
        'isEnrolled',
      )
      .setParameter('attendeeId', attendeeId ?? null)
      .leftJoin('s.enrollments', 'e')
      .groupBy('s.id')
      .orderBy('s.startsAt', 'ASC')
      .getRawMany<{
        id: string;
        title: string;
        startsAt: Date;
        capacity: number;
        status: 'scheduled' | 'cancelled';
        availableSeats: string;
        isEnrolled: boolean;
      }>();

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      startsAt: row.startsAt,
      capacity: Number(row.capacity),
      availableSeats: Number(row.availableSeats),
      status: row.status,
      isEnrolled:
        row.isEnrolled === true || (row.isEnrolled as unknown) === 't',
    }));
  }

  async getSessionRoster(sessionId: string): Promise<RosterEntry[]> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select('e.attendee_id', 'attendeeId')
      .addSelect('u.display_name', 'displayName')
      .addSelect('e.enrolled_at', 'enrolledAt')
      .from('enrollments', 'e')
      .innerJoin('users', 'u', 'u.id = e.attendee_id')
      .where('e.session_id = :sessionId', { sessionId })
      .andWhere("e.status = 'active'")
      .orderBy('e.enrolled_at', 'ASC')
      .getRawMany<{
        attendeeId: string;
        displayName: string;
        enrolledAt: Date;
      }>();

    return rows.map((row) => ({
      attendeeId: row.attendeeId,
      displayName: row.displayName,
      enrolledAt: row.enrolledAt,
    }));
  }
}
