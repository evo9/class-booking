# Task 13 — Presentation: Exception Filter + Actor Guard

**Layer:** shared/presentation + enrollment/presentation  
**Depends on:** 03  
**Blocks:** 14

## DomainExceptionFilter (shared — done)

Lives at `src/shared/presentation/filters/domain-exception.filter.ts`.

Each `DomainError` subclass declares its own `statusCode`:
```typescript
export class SessionFullError extends DomainError {
  readonly statusCode = 409;
  constructor() { super('Session is full'); }
}
```

The filter reads `exception.statusCode` — one filter for the entire app, never changes:
```typescript
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(exception.statusCode).json({
      statusCode: exception.statusCode,
      error: exception.name,
      message: exception.message,
    });
  }
}
```

Register in `main.ts`:
```typescript
app.useGlobalFilters(new DomainExceptionFilter());
```

## ActorGuard

`src/enrollment/presentation/guards/actor.guard.ts`

Reads `X-Actor-Id` and `X-Actor-Role` headers, attaches actor to request:
```typescript
@Injectable()
export class ActorGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const actorId = req.headers['x-actor-id'];
    const actorRole = req.headers['x-actor-role'];
    if (!actorId || !['admin', 'attendee'].includes(actorRole)) return false;
    req.actor = { id: actorId, role: actorRole };
    return true;
  }
}
```

Also checks `Reflector` for `REQUIRED_ROLE` metadata set by `@RequireRole()`.

## @RequireRole decorator

`src/enrollment/presentation/decorators/require-role.decorator.ts`
```typescript
export const REQUIRED_ROLE = 'required_role';
export const RequireRole = (role: 'admin' | 'attendee') =>
  SetMetadata(REQUIRED_ROLE, role);
```

## @Actor param decorator

`src/enrollment/presentation/decorators/actor.decorator.ts`
```typescript
export const Actor = createParamDecorator((_, ctx: ExecutionContext) =>
  ctx.switchToHttp().getRequest().actor
);
```
