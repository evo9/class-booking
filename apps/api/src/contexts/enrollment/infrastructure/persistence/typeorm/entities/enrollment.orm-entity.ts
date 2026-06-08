import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ClassSessionOrmEntity } from './class-session.orm-entity';

@Entity('enrollments')
@Unique(['sessionId', 'attendeeId'])
export class EnrollmentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'session_id' })
  sessionId!: string;

  @Column('uuid', { name: 'attendee_id' })
  attendeeId!: string;

  @Column('text')
  status!: string;

  @Column('timestamptz', { name: 'enrolled_at', default: () => 'NOW()' })
  enrolledAt!: Date;

  @ManyToOne(() => ClassSessionOrmEntity, (s) => s.enrollments)
  @JoinColumn({ name: 'session_id' })
  session!: ClassSessionOrmEntity;
}
