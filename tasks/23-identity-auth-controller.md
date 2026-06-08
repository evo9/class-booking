# Task 23 — Identity: AuthController (login / logout / me)

**Layer:** presentation  
**Depends on:** 21, 22  
**Blocks:** 24

## Goal

Три эндпоинта аутентификации с cookie-выдачей токена.

## Структура

```
src/contexts/identity/presentation/
  controllers/
    auth.controller.ts
  dto/
    login.dto.ts
    actor-response.dto.ts
  identity.module.ts
```

## Эндпоинты

| Method | Path | Описание |
|--------|------|---------|
| POST | `/api/auth/login` | Принимает email+password, выдаёт cookie с JWT, возвращает профиль |
| POST | `/api/auth/logout` | Очищает cookie |
| GET | `/api/auth/me` | Возвращает актора по cookie (восстановление сессии) |

## Login

```typescript
@Post('login')
async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
  const user = await this.userRepo.findByEmail(new Email(dto.email));
  if (!user || !(await this.passwordService.verify(user.passwordHash, dto.password))) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const token = this.jwtService.sign({ sub: user.id.value, role: user.role });
  res.cookie('access_token', token, {
    httpOnly: true,
    secure: false,        // dev; в проде: true + HTTPS
    sameSite: 'lax',      // работает с dev-proxy (one-origin)
    maxAge: 1000 * 60 * 60,
  });

  return { id: user.id.value, displayName: user.displayName, role: user.role };
}
```

## Logout

```typescript
@Post('logout')
logout(@Res({ passthrough: true }) res: Response) {
  res.clearCookie('access_token');
  return { ok: true };
}
```

## Me

```typescript
@Get('me')
@UseGuards(JwtAuthGuard)   // создаётся в задаче 24
me(@CurrentActor() actor: ActorContext) {
  return actor;
}
```

## Cookie params (§3.3 спека)

```typescript
httpOnly: true   // JS не читает токен — смысл выбора cookie вместо localStorage
secure: false    // dev без HTTPS; в проде true
sameSite: 'lax'  // работает с dev-proxy (one-origin)
maxAge: 3_600_000
```

## IdentityModule

```typescript
@Module({
  imports: [
    UserPersistenceModule,
    JwtModule.registerAsync({ ... }),
  ],
  controllers: [AuthController],
  providers: [PasswordService, AuthJwtService],
  exports: [AuthJwtService],  // нужен JwtAuthGuard в других модулях
})
export class IdentityModule {}
```

Зарегистрировать в `AppModule`.
