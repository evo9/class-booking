# Task 26 — Enrollment: attendeeId из JWT + бизнес-проверка владельца

**Layer:** application  
**Depends on:** 24  
**Blocks:** 27

## Goal

1. `EnrollAttendeeCommand` и `CancelEnrollmentCommand` получают `attendeeId` из аутентифицированного актора, а не из тела запроса.
2. `CancelEnrollmentHandler` проверяет что отменяющий владеет записью.

## Контроллер: attendeeId из актора

```typescript
@Post(':id/enrollments')
@UseGuards(JwtAuthGuard)
@RequireRole('attendee')
@HttpCode(201)
enroll(@Param('id') sessionId: string, @CurrentActor() actor: ActorContext) {
  return this.commandBus.execute(
    new EnrollAttendeeCommand(sessionId, actor.id)  // attendeeId = actor.id
  );
}

@Delete(':id/enrollments')
@UseGuards(JwtAuthGuard)
@RequireRole('attendee')
@HttpCode(204)
cancelEnrollment(@Param('id') sessionId: string, @CurrentActor() actor: ActorContext) {
  return this.commandBus.execute(
    new CancelEnrollmentCommand(sessionId, actor.id)
  );
}
```

## CancelEnrollmentHandler: проверка владельца

Бизнес-правило: нельзя отменить чужую запись. Проверяется в use-case, не в guard.

```typescript
async execute(cmd: CancelEnrollmentCommand) {
  const session = await this.repo.findById(SessionId.fromString(cmd.sessionId));
  if (!session) throw new SessionNotFoundError(cmd.sessionId);

  // Проверка что attendee отменяет СВОЮ запись
  const enrollment = session.getEnrollments().find(
    e => e.attendeeId.value === cmd.attendeeId && e.status === 'active'
  );
  if (!enrollment) throw new EnrollmentNotFoundError();
  // Если запись существует но принадлежит другому — EnrollmentNotFoundError (не раскрываем детали)

  session.cancelEnrollment(AttendeeId.fromString(cmd.attendeeId));
  await this.repo.save(session);
  this.eventBus.publishAll(session.pullEvents());
}
```

## Notes

- `attendeeId` никогда не берётся из тела запроса — только из cookie → JWT → actor.
- Guard отвечает за аутентификацию и ролевой доступ. Бизнес-авторизация («чужая запись») — в use-case.
- `EnrollmentNotFoundError` используется и для «не найдена» и для «чужая» — не раскрываем факт существования.
