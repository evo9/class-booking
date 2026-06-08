# Task 29 — Angular: экран логина + interceptor + environment

**Layer:** web  
**Depends on:** 28  
**Blocks:** 30

## Goal

Экран логина, HTTP-интерсептор с `withCredentials`, базовый URL из environment.

## Environment

`apps/web/src/environments/environment.ts`:
```typescript
export const environment = {
  apiUrl: '/api',   // через dev-proxy; в проде тот же путь
};
```

## HTTP Interceptor (withCredentials)

`apps/web/src/app/interceptors/credentials.interceptor.ts`

```typescript
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};
```

Заменяет старый `ActorInterceptor` (убрать).

Регистрация в `app.config.ts`:
```typescript
provideHttpClient(withInterceptors([credentialsInterceptor]))
```

## ApiService (базовый URL)

`apps/web/src/app/services/api.service.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = inject(environment).apiUrl;  // '/api'
  // или просто инжектировать environment напрямую в каждый сервис
}
```

Либо проще: везде префиксировать запросы `environment.apiUrl`.

## Login screen

`apps/web/src/app/auth/login.component.ts`

- Standalone, `OnPush`
- Typed reactive form: `FormGroup<{ email: FormControl<string>; password: FormControl<string> }>`
- `POST /api/auth/login` → успех: сохранить актора в `AuthStore`, навигация на `/`
- Ошибка 401: показать «Неверный email или пароль»

```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <input formControlName="email" type="email" placeholder="Email" />
      <input formControlName="password" type="password" placeholder="Password" />
      <button type="submit" [disabled]="form.invalid || loading()">Войти</button>
      @if (error()) { <p>{{ error() }}</p> }
    </form>
  `
})
```

## Роутинг

```typescript
{ path: 'login', component: LoginComponent },
{ path: '', component: SessionsListComponent, canActivate: [authGuard] },
```

`authGuard` — проверяет что актор инициализирован, иначе → `/login`.
