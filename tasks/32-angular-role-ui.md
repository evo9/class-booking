# Task 32 — Angular: ролевой UI, loading/empty/error, «мои записи»

**Layer:** web  
**Depends on:** 31  
**Blocks:** 33

## Goal

Функциональный ролевой UI, честные состояния экранов, состояние «ты уже записан» после F5.

## «Мои записи»

Добавить поле `isEnrolled: boolean` в `SessionListItemDto` (contracts) — сервер проставляет на основе текущего актора.

Backend: в `ListAvailableSessionsHandler` передавать `attendeeId` актора, read-репозиторий добавляет флаг:

```sql
CASE WHEN EXISTS (
  SELECT 1 FROM enrollments e2
  WHERE e2.session_id = s.id
    AND e2.attendee_id = :attendeeId
    AND e2.status = 'active'
) THEN true ELSE false END AS "isEnrolled"
```

После F5: `init()` → `/me` → loadSessions(attendeeId) → `isEnrolled` проставлен → «отмена» показана.

## SessionsListComponent — состояния

```html
@if (store.loading()) {
  <app-skeleton />           <!-- loading state -->
} @else if (store.error()) {
  <app-error [message]="store.error()!" (retry)="store.loadSessions()" />
} @else if (store.sessions().length === 0) {
  <p>Нет доступных сессий</p>   <!-- empty state -->
} @else {
  @for (session of store.sessions(); track session.id) {
    <app-session-card [session]="session" />
  }
}
```

## SessionCardComponent

```typescript
// Attendee видит:
// - "Записаться" (disabled если availableSeats=0 или cancelled)
// - "Отменить запись" если session.isEnrolled
// Admin видит:
// - Кнопку "Ростер" (ссылка на /sessions/:id/roster)
// - Кнопку "Отменить сессию"
```

## Ролевое разделение

```typescript
readonly isAdmin = inject(AuthStore).isAdmin;

// В шаблоне:
@if (isAdmin()) {
  <button routerLink="/sessions/{{ session.id }}/roster">Ростер</button>
} @else {
  @if (session.isEnrolled) {
    <button (click)="cancel(session.id)">Отменить запись</button>
  } @else {
    <button [disabled]="session.availableSeats === 0 || session.status === 'cancelled'"
            (click)="enroll(session.id)">
      Записаться
    </button>
  }
}
```

## CreateSessionComponent

Только для admin. Route guard: `canActivate: [() => inject(AuthStore).isAdmin()]`.

## RosterComponent

Обновить — теперь показывает `displayName` (из задачи 27), а не UUID.

## Notes

- Все компоненты: `ChangeDetectionStrategy.OnPush`, standalone.
- Состояния loading/empty/error — не пустота в DOM, а явные блоки.
- После F5 `isEnrolled` корректен потому что `/me` + `loadSessions(attendeeId)` выполняются при старте.
