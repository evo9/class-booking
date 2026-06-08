# Task 30 — Angular: восстановление сессии через /me

**Layer:** web  
**Depends on:** 29  
**Blocks:** 31

## Goal

При старте приложения — запрос `GET /api/auth/me`. Если cookie валидна — актор восстанавливается, приложение открывается. Если нет — редирект на `/login`.

Это убирает проблему «обновил страницу — вышел из системы».

## AuthStore

`apps/web/src/app/auth/auth.store.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly http = inject(HttpClient);

  readonly actor = signal<ActorDto | null>(null);
  readonly initialized = signal(false);  // true после попытки /me (успешной или нет)

  readonly isLoggedIn = computed(() => this.actor() !== null);
  readonly isAdmin = computed(() => this.actor()?.role === 'admin');

  async init(): Promise<void> {
    try {
      const actor = await firstValueFrom(
        this.http.get<ActorDto>(`${environment.apiUrl}/auth/me`)
      );
      this.actor.set(actor);
    } catch {
      this.actor.set(null);  // 401 — не залогинен
    } finally {
      this.initialized.set(true);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const actor = await firstValueFrom(
      this.http.post<ActorDto>(`${environment.apiUrl}/auth/login`, { email, password })
    );
    this.actor.set(actor);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/logout`, {}));
    this.actor.set(null);
  }
}
```

## App initializer

В `app.config.ts`:
```typescript
provideAppInitializer(() => inject(AuthStore).init())
```

Приложение не рендерится до завершения `init()` — нет флика «залогинен/не залогинен».

## authGuard

```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};
```

## Notes

- `initialized` signal нужен чтобы не показывать `/login` пока `/me` ещё в полёте.
- После F5: `init()` → `/me` → актор восстановлен → приложение открыто на нужном экране.
