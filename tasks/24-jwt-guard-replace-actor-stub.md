# Task 24 — JwtAuthGuard + замена X-Actor-* заглушки

**Layer:** shared/presentation + enrollment/presentation  
**Depends on:** 23  
**Blocks:** 26

## Goal

Заменить заглушку `ActorGuard` (X-Actor-* заголовки) на `JwtAuthGuard` (cookie).

## JwtAuthGuard

`src/shared/presentation/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: AuthJwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const token = req.cookies?.['access_token'];
    if (!token) return false;

    const payload = this.jwtService.verify(token);
    if (!payload) return false;

    req.actor = { id: payload.sub, role: payload.role };
    return true;
  }
}
```

## @CurrentActor decorator

`src/shared/presentation/decorators/current-actor.decorator.ts`

```typescript
export const CurrentActor = createParamDecorator(
  (_, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().actor,
);
```

## @RequireRole decorator (перенос из enrollment в shared)

Переместить `@RequireRole` из `enrollment/presentation/decorators/` в `shared/presentation/decorators/` — он будет использоваться в обоих контекстах.

## Замена в EnrollmentModule

В `sessions.controller.ts`:
- Заменить `@UseGuards(ActorGuard)` → `@UseGuards(JwtAuthGuard)`
- Заменить `@Actor()` → `@CurrentActor()`
- Удалить импорты `ActorGuard`, `Actor`

Удалить файлы:
- `enrollment/presentation/guards/actor.guard.ts` (и spec)
- `enrollment/presentation/decorators/actor.decorator.ts`
- `enrollment/presentation/decorators/require-role.decorator.ts` (перенесён в shared)

## ActorContext type

```typescript
// src/shared/presentation/types/actor-context.type.ts
export interface ActorContext {
  id: string;    // UserId
  role: 'admin' | 'attendee';
}
```

## Notes

- `JwtAuthGuard` нужен `AuthJwtService` — значит `IdentityModule` должен экспортировать его,
  а `EnrollmentModule` (или глобальный модуль) импортировать `IdentityModule`.
- Лучший вариант: зарегистрировать `JwtAuthGuard` как global guard в `AppModule`.
