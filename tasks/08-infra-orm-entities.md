# Task 08 — Infrastructure: TypeORM ORM Entities

**Layer:** infrastructure  
**Depends on:** nothing (pure ORM mapping, no domain imports)  
**Blocks:** 09, 10, 11

## Goal

Create TypeORM entity classes. These are separate from domain classes — they exist solely for persistence.
Do NOT import domain classes here (no circular dependency risk).

## Files to create

`apps/api/src/enrollment/infrastructure/persistence/typeorm/entities/`

### `class-session.orm-entity.ts`

```typescript
@Entity('class_sessions')
export class ClassSessionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('text')
  title: string;

  @Column('timestamptz')
  startsAt: Date;

  @Column('int')
  capacity: number;

  @Column('text')
  status: string;  // 'scheduled' | 'cancelled'

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => EnrollmentOrmEntity, e => e.session, { cascade: true, eager: true })
  enrollments: EnrollmentOrmEntity[];
}
```

### `enrollment.orm-entity.ts`

```typescript
@Entity('enrollments')
@Unique(['sessionId', 'attendeeId'])
export class EnrollmentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'session_id' })
  sessionId: string;

  @Column('uuid', { name: 'attendee_id' })
  attendeeId: string;

  @Column('text')
  status: string;  // 'active' | 'cancelled'

  @Column('timestamptz', { name: 'enrolled_at' })
  enrolledAt: Date;

  @ManyToOne(() => ClassSessionOrmEntity, s => s.enrollments)
  @JoinColumn({ name: 'session_id' })
  session: ClassSessionOrmEntity;
}
```

## Notes

- `@VersionColumn()` on `ClassSessionOrmEntity` enables optimistic locking automatically in TypeORM.
- `eager: true` on enrollments: when loading the session aggregate, enrollments are always included (needed to enforce invariants).
- No domain classes imported here.
