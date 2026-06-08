# Task 20 — Identity: Domain Layer

**Layer:** domain  
**Depends on:** 19  
**Blocks:** 21, 22

## Goal

Создать доменный слой контекста Identity: агрегат `User`, value objects, порт репозитория.
Чистый TypeScript — ноль NestJS/TypeORM.

## Структура

```
src/contexts/identity/domain/
  entities/
    user.aggregate.ts
    index.ts
  value-objects/
    user-id.vo.ts          # branded UUID (аналог SessionId)
    email.vo.ts            # валидирует формат email
    user-role.vo.ts        # 'admin' | 'attendee'
    index.ts
  ports/
    user.repository.ts     # интерфейс (порт)
    index.ts
  index.ts
```

## User aggregate

```typescript
export class User {
  readonly id: UserId;
  readonly email: Email;
  readonly passwordHash: string;
  readonly displayName: string;
  readonly role: UserRole;

  // Нет методов мутации — User иммутабелен в рамках этого проекта.
  // Пароль хешируется ВНЕ агрегата (PasswordService в инфраструктуре).
  // Роль — поле, не RBAC-модель. При росте до гранулярных прав → отдельная модель.

  constructor(props: { id: UserId; email: Email; passwordHash: string; displayName: string; role: UserRole }) { ... }

  static reconstitute(props: ...): User { ... }
}
```

## UserRepository port

```typescript
export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
  nextId(): UserId;
}

export const USER_REPOSITORY = Symbol('UserRepository');
```

## Value Objects

- `UserId` — branded UUID (можно переиспользовать паттерн из SessionId)
- `Email` — валидирует через regex `/.+@.+\..+/`, бросает DomainError если невалидный
- `UserRole` — `'admin' | 'attendee'` (тип-объединение, не enum)

## Notes

- `User` — не `AggregateRoot` (не поднимает события). Нет мутирующих методов в scope этого проекта.
- `passwordHash` хранится в домене как строка — домен не знает алгоритма хеширования.
- Граница: `enrollment` НЕ импортирует `User`. Знает только `attendeeId: AttendeeId` (UUID-ссылка).
