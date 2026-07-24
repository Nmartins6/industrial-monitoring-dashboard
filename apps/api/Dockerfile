FROM node:24.16.0-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile

FROM dependencies AS builder

COPY . .

RUN pnpm --filter @industrial-monitoring/contracts build \
  && pnpm --filter @industrial-monitoring/api build

FROM node:24.16.0-bookworm-slim AS runner

ENV NODE_ENV="production"
ENV PORT="3333"
ENV DATABASE_PATH="/app/data/industrial-monitoring.db"

WORKDIR /app

COPY --from=builder --chown=node:node /app/apps/api/dist apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json apps/api/package.json
COPY --from=builder --chown=node:node /app/packages/contracts/dist packages/contracts/dist
COPY --from=builder --chown=node:node /app/packages/contracts/package.json packages/contracts/package.json

RUN mkdir -p apps/api/node_modules/@industrial-monitoring data \
  && ln -s ../../../../packages/contracts apps/api/node_modules/@industrial-monitoring/contracts \
  && chown -R node:node /app

USER node

EXPOSE 3333

CMD ["node", "apps/api/dist/server.js"]

