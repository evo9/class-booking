# Task 21 — Identity: Infrastructure (ORM + Repository)

**Layer:** infrastructure  
**Depends on:** 20  
**Blocks:** 22, 25

## Goal

TypeORM-сущность, маппер и адаптер репозитория для контекста Identity.

## Структура

```
src/contexts/identity/infrastructure/persistence/typeorm/
  entities/
    user.orm-entity.ts
    index.ts
  mappers/
    user.mapper.ts
    index.ts
  repositories/
    typeorm-user.repository.ts
    index.ts
  index.ts
```

Отдельный `UserPersistenceModule` не нужен — следуем тому же паттерну что и `EnrollmentModule`:
`TypeOrmModule.forFeature`, провайдеры и DI-токен регистрируются напрямую в `IdentityModule`.

## UserOrmEntity

```typescript
@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column() passwordHash: string;
  @Column() displayName: string;
  @Column() role: string;   // 'admin' | 'attendee'
  @CreateDateColumn() createdAt: Date;
}
```

`SnakeNamingStrategy` конвертирует `passwordHash` → `password_hash`, `displayName` → `display_name` автоматически.

## UserMapper

```typescript
export class UserMapper {
  static toDomain(orm: UserOrmEntity): User { ... }
  static toOrm(domain: User): UserOrmEntity { ... }
}
```

## TypeOrmUserRepository

Implements `UserRepository` port from domain:

```typescript
@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  async findByEmail(email: Email): Promise<User | null> {
    const orm = await this.repo.findOne({ where: { email: email.value } });
    return orm ? UserMapper.toDomain(orm) : null;
  }
  async findById(id: UserId): Promise<User | null> { ... }
  async save(user: User): Promise<void> {
    await this.repo.save(UserMapper.toOrm(user));
  }
  nextId(): UserId { return UserId.create(); }
}
```

## Регистрация в IdentityModule (task 23)

`TypeOrmModule.forFeature([UserOrmEntity])` и провайдеры регистрируются напрямую в `IdentityModule` — никакого отдельного `UserPersistenceModule`. Паттерн идентичен `EnrollmentModule`.

## Migration

После создания ORM-сущности запустить:
```bash
pnpm migration:diff
pnpm migration:migrate
```

Должна создаться таблица `users` с колонками `id, email, password_hash, display_name, role, created_at`.
