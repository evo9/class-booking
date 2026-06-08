# Task 22 — Identity: PasswordService + JwtService

**Layer:** infrastructure/auth  
**Depends on:** 20  
**Blocks:** 23

## Goal

Два сервиса в `src/contexts/identity/infrastructure/auth/`:
- `PasswordService` — хеширование и верификация пароля
- `JwtService` — подпись и верификация JWT

## Структура

```
src/contexts/identity/infrastructure/auth/
  password.service.ts
  jwt.service.ts
  index.ts
```

## Зависимости

```bash
pnpm --filter api add argon2 @nestjs/jwt
```

## PasswordService

```typescript
@Injectable()
export class PasswordService {
  async hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
```

## JwtService (обёртка над @nestjs/jwt)

```typescript
@Injectable()
export class AuthJwtService {
  constructor(private readonly jwt: NestJwtService) {}

  sign(payload: { sub: string; role: string }): string {
    return this.jwt.sign(payload);
  }

  verify(token: string): { sub: string; role: string } | null {
    try {
      return this.jwt.verify(token);
    } catch {
      return null;
    }
  }
}
```

## Config

JWT secret и expiry через `ConfigService`:

```typescript
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_SECRET', 'dev-secret-change-in-prod'),
    signOptions: { expiresIn: '1h' },
  }),
})
```

Добавить в `apps/api/.env` и `.env.example`:
```
JWT_SECRET=dev-secret-change-in-prod
```

## Notes

- `argon2` предпочтительнее `bcrypt` — более стойкий к GPU-атакам. Если возникнут проблемы с native bindings — fallback на `bcrypt`.
- JWT payload: `{ sub: userId, role }`. Минимальный — не тянуть displayName в токен.
