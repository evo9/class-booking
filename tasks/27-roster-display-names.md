# Task 27 — Roster: отображение имён через JOIN на read-стороне

**Layer:** infrastructure/read  
**Depends on:** 21, 26  
**Blocks:** 33 (README)

## Goal

Ростер возвращает `displayName` вместо голого `attendeeId`. 
Механизм — JOIN `enrollments × users` на read-стороне.

## Почему JOIN, не read-порт

CQRS не ограничивает read-запросы границами агрегатов. Граница агрегата — про write-сторону (консистентность, транзакции). Read-сторона — проекция для отображения. В пределах **одной БД** джойн таблиц разных контекстов корректен.

Read-порт `AttendeeDisplayPort` нужен только при раздельных хранилищах (разные БД/сервисы). Для монолитного booking — оверкилл. Разбор в README (задача 33).

## Изменения в TypeOrmSessionReadRepository

`src/contexts/enrollment/infrastructure/persistence/typeorm/repositories/typeorm-session-read.repository.ts`

```typescript
async getSessionRoster(sessionId: string): Promise<RosterEntry[]> {
  return this.dataSource
    .createQueryBuilder()
    .select('e.attendee_id', 'attendeeId')
    .addSelect('u.display_name', 'displayName')
    .from('enrollments', 'e')
    .innerJoin('users', 'u', 'u.id = e.attendee_id')
    .where('e.session_id = :sessionId', { sessionId })
    .andWhere("e.status = 'active'")
    .orderBy('e.enrolled_at', 'ASC')
    .getRawMany<{ attendeeId: string; displayName: string }>();
}
```

## Обновить RosterEntry DTO

В `application/ports/session-read.repository.port.ts`:
```typescript
export interface RosterEntry {
  attendeeId: string;
  displayName: string;   // было: enrolledAt: Date — убираем или оставляем оба
  enrolledAt: Date;
}
```

Обновить `RosterEntryDto` в `packages/contracts/index.ts` и Angular-фронт.

## Notes

- `innerJoin` — если у `attendeeId` нет строки в `users`, запись просто не попадёт в ростер.
  Для demo-проекта с сидингом это нормально. В продакшн — `leftJoin` с fallback.
- Write-сторона не меняется: `ClassSession.enroll()` по-прежнему знает только `AttendeeId`.
