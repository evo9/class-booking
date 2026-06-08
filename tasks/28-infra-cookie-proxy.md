# Task 28 — Инфраструктура: cookie-parser, global prefix, CORS, dev-proxy

**Layer:** infrastructure / devops  
**Depends on:** 23  
**Blocks:** 29 (фронт)

## Goal

Настроить всё что нужно для корректной работы cookie-аутентификации.

## Backend: main.ts

```bash
pnpm --filter api add cookie-parser
pnpm --filter api add -D @types/cookie-parser
```

```typescript
import cookieParser from 'cookie-parser';

app.use(cookieParser());
app.setGlobalPrefix('api');
app.enableCors({
  origin: 'http://localhost:4200',
  credentials: true,   // обязательно для cookie через CORS
});
```

## Angular: proxy.conf.json

`apps/web/proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

Подключить в `angular.json` (не флагом CLI — тогда работает при любом запуске):
```json
"serve": {
  "options": {
    "proxyConfig": "proxy.conf.json"
  }
}
```

## Почему proxy обязателен (§8.1 спека)

Без proxy: фронт на `:4200`, бэк на `:3000` — два разных origin.
`sameSite: 'lax'` + `secure: false` → cookie не сохраняется.
Единственное решение в dev без HTTPS: proxy делает всё one-origin (`:4200/api` → `:3000/api`).
CORS с `credentials: true` оставить — нужен для prod (nginx reverse proxy).

## В prod (в README)

```
nginx:
  /api → backend:3000
  /    → frontend:4200 (static)
```

Angular proxy — только dev. В проде: единый origin через reverse proxy + `secure: true` cookie.
