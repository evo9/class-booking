# Task 33 — README: Identity, граница контекстов, cookie/proxy, no-SSR

**Depends on:** 19–32  
**Blocks:** ничего

## Goal

Дописать README разделами про Identity и архитектурными разборами из спека.

## Разделы для добавления

### Identity bounded context

- Что делает, почему отдельный контекст
- Структура `src/contexts/`
- Роль как поле (`UserRole`), не RBAC: аргументация, триггер для расширения

### Граница между контекстами

- Write-сторона: `enrollment` знает только `attendeeId: UUID` — не загружает `User`
- «Контексты общаются по id, не по объектам»

### Отображение участников: джоин на read-стороне

Ключевой разбор:
- CQRS не распространяет границы агрегатов на запросы
- Read-сторона — проекция для отображения; в пределах одной БД джойн таблиц разных контекстов корректен
- Когда НЕ подходит: раздельные хранилища (разные сервисы/БД) → тогда нужен read-порт `AttendeeDisplayPort`
- Триггер — не тип движка, а **невозможность джоина**. Два Postgres в разных сервисах требуют порта так же как Postgres + Mongo

### Cookie, dev-proxy, prod

- Почему cookie вместо localStorage: `httpOnly` — JS не читает токен
- Почему dev-proxy обязателен: `sameSite: 'lax'` + `secure: false` работают только в one-origin контексте
- Prod: nginx reverse proxy (`/api` → backend, `/` → static), `secure: true` cookie

### Почему нет SSR

- Booking за логином — SEO не нужно
- Auth с SSR требует ручного проброса cookie в серверные HTTP-запросы (нет браузерного cookie-jar)
- CSR от этой проблемы свободен

### Dev credentials

| Email | Password | Role |
|-------|----------|------|
| admin@booking.dev | admin123 | admin |
| alice@booking.dev | alice123 | attendee |
| bob@booking.dev | bob123 | attendee |
| carol@booking.dev | carol123 | attendee |
