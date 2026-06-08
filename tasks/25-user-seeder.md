# Task 25 — User Seeder

**Layer:** infrastructure  
**Depends on:** 21, 22  
**Blocks:** ничего (можно параллельно с 24)

## Goal

Идемпотентный сидер создаёт фиксированный набор пользователей при старте приложения (dev).

## Файл

`src/contexts/identity/infrastructure/seeding/user.seeder.ts`

## Реализация

```typescript
@Injectable()
export class UserSeeder implements OnModuleInit {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: UserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed() {
    const users = [
      { email: 'admin@booking.dev', password: 'admin123', displayName: 'Admin', role: 'admin' as const },
      { email: 'alice@booking.dev', password: 'alice123', displayName: 'Alice', role: 'attendee' as const },
      { email: 'bob@booking.dev',   password: 'bob123',   displayName: 'Bob',   role: 'attendee' as const },
      { email: 'carol@booking.dev', password: 'carol123', displayName: 'Carol', role: 'attendee' as const },
    ];

    for (const u of users) {
      const existing = await this.repo.findByEmail(new Email(u.email));
      if (existing) continue; 

      const passwordHash = await this.passwordService.hash(u.password);
      const user = new User({
        id: this.repo.nextId(),
        email: new Email(u.email),
        passwordHash,
        displayName: u.displayName,
        role: u.role,
      });
      await this.repo.save(user);
    }
  }
}
```

## Регистрация в IdentityModule

```typescript
providers: [..., UserSeeder],
```

## Dev credentials (задокументировать в README)

| Email | Password | Role |
|-------|----------|------|
| admin@booking.dev | admin123 | admin |
| alice@booking.dev | alice123 | attendee |
| bob@booking.dev | bob123 | attendee |
| carol@booking.dev | carol123 | attendee |

## Notes

- Сидер запускается только при старте — в проде отключить через `NODE_ENV !== 'development'` guard.
- Пароли в README — это dev-credentials, не секреты. Нормально коммитить.
