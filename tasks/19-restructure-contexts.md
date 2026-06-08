# Task 19 — Restructure: src/ → src/contexts/

**Depends on:** все предыдущие задачи завершены  
**Blocks:** 20–27

## Goal

Переместить `enrollment` под общую директорию `contexts/` — готовим место для второго контекста Identity.

## Итоговая структура

```
apps/api/src/
├── contexts/
│   ├── enrollment/      ← бывш. src/enrollment/
│   └── identity/        ← создаётся в задаче 20
├── shared/              ← остаётся на месте
├── infrastructure/      ← остаётся (typeorm, config)
└── main.ts
```

## Шаги

1. Создать `src/contexts/`
2. Переместить `src/enrollment/` → `src/contexts/enrollment/`
3. Обновить все импорты:
   - `@src/enrollment/...` → `@src/contexts/enrollment/...` во всех файлах в `src/`
   - Это затрагивает все handler'ы, mapper, repositories, module, presentation

```bash
# Быстрая замена во всех .ts файлах
find src -name "*.ts" | xargs sed -i "s|@src/enrollment/|@src/contexts/enrollment/|g"
```

4. Убедиться что `enrollment.module.ts` и `app.module.ts` обновились
5. Запустить `pnpm test:api` — все тесты должны пройти
6. Запустить `pnpm build:api` — должен компилироваться без ошибок

## Важно

Не трогать `src/shared/` и `src/infrastructure/` — они остаются на месте.
`@src/shared/...` и `@src/infrastructure/...` импорты не меняются.
