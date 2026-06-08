# syntax=docker/dockerfile:1.7

# ---------- base: node + pnpm через corepack ----------
FROM node:24.16.0-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /repo

# ---------- deps: ставим зависимости (этот слой кешируется) ----------
FROM base AS deps
# Копируем ТОЛЬКО манифесты + lockfile — НЕ исходники.
# Пока эти файлы не меняются, слой install берётся из кеша.
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/contracts/package.json ./packages/contracts/

# BuildKit cache mount: pnpm-стор переживает пересборки между билдами.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter api... --filter @class-booking/contracts

# ---------- build: компилируем contracts, затем api ----------
FROM deps AS build
# Теперь копируем исходники. Изменение кода бьёт ТОЛЬКО этот слой, не install.
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api
RUN pnpm --filter @class-booking/contracts build \
 && pnpm --filter api build

# Готовим изолированный прод-артефакт со всеми воркспейс-зависимостями.
RUN pnpm --filter api deploy --prod /prod/api

# ---------- runtime: тонкий финальный образ ----------
FROM node:24.16.0-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Из deploy-папки приезжает плоский node_modules с уже вшитым contracts.
COPY --from=build /prod/api/node_modules ./node_modules
COPY --from=build /prod/api/dist ./dist
COPY --from=build /prod/api/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
