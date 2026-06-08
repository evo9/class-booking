# Task 17 — Frontend: Angular (3 screens)

**Layer:** web  
**Depends on:** 14 (API must be running)  
**Blocks:** nothing

## Goal

Build a thin Angular frontend: standalone components, signals, OnPush.
Not the star of the project — keep it clean and functional, not fancy.

## Files to create

`apps/web/src/app/`

### HTTP Interceptor (auth stub)

`interceptors/actor.interceptor.ts`

Reads current actor from a shared signal/service and adds headers to every request:
```
X-Actor-Id: <uuid>
X-Actor-Role: admin | attendee
```

### Actor Service

`services/actor.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ActorService {
  readonly role = signal<'admin' | 'attendee'>('attendee');
  readonly actorId = signal<string>(crypto.randomUUID()); // fixed for session
  toggle() { this.role.set(this.role() === 'admin' ? 'attendee' : 'admin'); }
}
```

### App Shell (`app.ts` / `app.html`)

Header with role toggle (tumbler: Admin / Attendee).
Router outlet for screens.

### Screen 1: Sessions List

`sessions/sessions-list.component.ts`

- Loads `GET /sessions` on init.
- Displays cards: title, date/time, "N seats left".
- "Enroll" button — disabled if `availableSeats === 0` or `status === 'cancelled'`, hidden for admin role.
- On enroll: `POST /sessions/:id/enrollments`, then refresh list.

### Screen 2: Session Roster (admin only)

`sessions/session-roster.component.ts`

- Route: `/sessions/:id/roster`
- Loads `GET /sessions/:id/roster`.
- Table: attendeeId, enrolledAt.
- Link back to list.

### Screen 3: Create Session (admin only)

`sessions/create-session.component.ts`

- Route: `/sessions/new` (visible only when role === 'admin')
- Form: title (text), startsAt (datetime-local), capacity (number ≥ 1).
- On submit: `POST /sessions`, navigate back to list on success.

### Routing

```typescript
export const routes: Routes = [
  { path: '', component: SessionsListComponent },
  { path: 'sessions/new', component: CreateSessionComponent },
  { path: 'sessions/:id/roster', component: SessionRosterComponent },
];
```

## Notes

- Use `HttpClient` + `takeUntilDestroyed()` for all requests.
- Use `ChangeDetectionStrategy.OnPush` on all components.
- Use signals for state where it makes sense (actor role, list data).
- No router guards on admin routes needed — the API guard enforces access.
- No design system / heavy styling. Minimal CSS is fine.
- Use types from `packages/contracts` (`SessionListItemDto`, `RosterEntryDto`, `ScheduleSessionRequestDto`).
