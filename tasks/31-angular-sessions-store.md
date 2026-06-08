# Task 31 — Angular: SessionsStore на сигналах + оптимистичные апдейты

**Layer:** web  
**Depends on:** 30  
**Blocks:** 32

## Goal

`SessionsStore` — единый источник правды для списка сессий. Оптимистичные апдейты с откатом при ошибке.

## SessionsStore

`apps/web/src/app/sessions/sessions.store.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class SessionsStore {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);

  readonly sessions = signal<SessionListItemDto[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Мои активные записи (attendeeId = actor.id)
  readonly myEnrollments = computed(() =>
    this.sessions().filter(s =>
      s.availableSeats < s.capacity  // упрощение — лучше хранить отдельно
    )
  );

  async loadSessions(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const sessions = await firstValueFrom(
        this.http.get<SessionListItemDto[]>(`${environment.apiUrl}/sessions`)
      );
      this.sessions.set(sessions);
    } catch {
      this.error.set('Не удалось загрузить сессии');
    } finally {
      this.loading.set(false);
    }
  }

  async enroll(sessionId: string): Promise<void> {
    // Оптимистичный апдейт — мгновенно уменьшаем место
    const prev = this.sessions();
    this.sessions.update(list =>
      list.map(s => s.id === sessionId ? { ...s, availableSeats: s.availableSeats - 1 } : s)
    );

    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/sessions/${sessionId}/enrollments`, {})
      );
    } catch (err: any) {
      // Откат при ошибке (409 — мест нет или уже записан)
      this.sessions.set(prev);
      throw err;  // пробрасываем чтобы компонент показал ошибку
    }
  }

  async cancelEnrollment(sessionId: string): Promise<void> {
    const prev = this.sessions();
    this.sessions.update(list =>
      list.map(s => s.id === sessionId ? { ...s, availableSeats: s.availableSeats + 1 } : s)
    );

    try {
      await firstValueFrom(
        this.http.delete(`${environment.apiUrl}/sessions/${sessionId}/enrollments`)
      );
    } catch {
      this.sessions.set(prev);
    }
  }
}
```

## Зачем оптимистичные апдейты

- UI реагирует мгновенно → демонстрирует владение реактивностью
- Сценарий overbooking: два таба, последнее место → в одном записались, второй видит 0 мест, кнопка задизейблена
- При 409: откат + показ ошибки «мест больше нет» — корректное разрешение гонки на фронте

## Notes

- Для полноценного «ты уже записан» нужен отдельный `myEnrollments` endpoint или поле в `SessionListItemDto`. Разобрать в задаче 32.
- Не использовать `resource()` API — он experimental в текущей версии Angular.
