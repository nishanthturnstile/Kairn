# syntax=docker/dockerfile:1
FROM node:26.13.0-bookworm-slim@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9 AS base
RUN npm install --global pnpm@12.16.1
RUN mkdir -p /app && chown node:node /app
WORKDIR /app

FROM base AS dependencies
USER node
ENV PNPM_CONFIG_STORE_DIR=/home/node/.local/share/pnpm/store
RUN mkdir -p node_modules
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node patches ./patches
COPY --chown=node:node apps/web/package.json ./apps/web/package.json
COPY --chown=node:node apps/server/package.json ./apps/server/package.json
COPY --chown=node:node apps/worker/package.json ./apps/worker/package.json
COPY --chown=node:node apps/mobile/package.json ./apps/mobile/package.json
COPY --chown=node:node packages/backend/package.json ./packages/backend/package.json
COPY --chown=node:node packages/contracts/package.json ./packages/contracts/package.json
COPY --chown=node:node packages/shared/package.json ./packages/shared/package.json
COPY --chown=node:node packages/sync-protocol/package.json ./packages/sync-protocol/package.json
COPY --chown=node:node packages/design-tokens/package.json ./packages/design-tokens/package.json
COPY --chown=node:node tools/api-generation/package.json ./tools/api-generation/package.json
RUN --mount=type=cache,id=kairn-pnpm,target=/home/node/.local/share/pnpm/store,uid=1000,gid=1000 pnpm install --frozen-lockfile

FROM dependencies AS source
COPY --chown=node:node . .

FROM source AS development
RUN pnpm build:packages && pnpm --filter @kairn/web build
ENV NODE_ENV=development
CMD ["pnpm", "--filter", "@kairn/server", "dev"]

FROM source AS worker-development
RUN pnpm build:packages
ENV NODE_ENV=development
CMD ["pnpm", "--filter", "@kairn/worker", "dev"]

FROM dependencies AS browser-tools
USER root
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN pnpm exec playwright install --with-deps chromium
USER node

FROM browser-tools AS tooling
COPY --chown=node:node . .
CMD ["pnpm", "check"]

FROM source AS build
RUN --mount=type=cache,id=kairn-pnpm,target=/home/node/.local/share/pnpm/store,uid=1000,gid=1000 pnpm build:server && pnpm --filter @kairn/server deploy --prod /app/.runtime

FROM source AS worker-build
RUN --mount=type=cache,id=kairn-pnpm,target=/home/node/.local/share/pnpm/store,uid=1000,gid=1000 pnpm build:worker && pnpm --filter @kairn/worker deploy --prod /app/.worker && pnpm --filter @kairn/backend deploy --prod /app/.migrate

FROM node:26.13.0-bookworm-slim@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9 AS worker-runtime
WORKDIR /app
COPY --from=worker-build --chown=node:node /app/.worker ./
USER node
ENV NODE_ENV=production
CMD ["node", "--enable-source-maps", "dist/index.js"]

FROM node:26.13.0-bookworm-slim@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9 AS migrate
WORKDIR /app
COPY --from=worker-build --chown=node:node /app/.migrate ./
USER node
ENV NODE_ENV=production
CMD ["node", "--enable-source-maps", "dist/bootstrap.js"]

FROM node:26.13.0-bookworm-slim@sha256:bc0a2afd3b74ce12222fc8bab99271e66257f021078f5f4a5d687a77d280c1d9 AS runtime
WORKDIR /app
COPY --from=build --chown=node:node /app/.runtime ./
USER node
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["node", "--enable-source-maps", "dist/index.js"]
