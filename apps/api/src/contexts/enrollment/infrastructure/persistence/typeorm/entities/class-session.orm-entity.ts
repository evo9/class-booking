import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  VersionColumn,
} from 'typeorm';
import { EnrollmentOrmEntity } from './enrollment.orm-entity';

@Entity('class_sessions')
@Check('"capacity" > 0')
export class ClassSessionOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text')
  title!: string;

  @Column('timestamptz')
  startsAt!: Date;

  @Column('int')
  capacity!: number;

  @Column('text')
  status!: string;

  @VersionColumn({ default: 0 })
  version!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => EnrollmentOrmEntity, (e) => e.session, {
    cascade: true,
    eager: true,
  })
  enrollments!: EnrollmentOrmEntity[];
}
