# syntax=docker/dockerfile:1
#
# @alcha/api — NestJS + Prisma.
# Built from the REPO ROOT so the pnpm workspace and lockfile are intact:
#   docker build -f apps/api/Dockerfile -t alcha-api .
#
# Deliberate choices, each one a trap we already hit:
#  * pnpm is pinned to 9.15.4. pnpm 10+ blocks lifecycle scripts by default, which
#    silently skips the esbuild and @prisma/engines postinstalls — you get a green
#    install, a failing tsup, and a Prisma client with no query engine.
#  * tsconfig.base.json is copied explicitly. packages/shared/tsconfig.json extends
#    it, and any pruning step drops it (verified: `turbo prune --docker` does not
#    carry it), which fails the shared build with TS5083.
#  * devDependencies are kept in the runtime image on purpose: `prisma migrate
#    deploy` needs the prisma CLI, which is a devDependency. Pruning them saves
#    ~400 MB and costs us the ability to migrate or seed. Disk is not the
#    constraint on this box; a broken migration path would be.
#  * The entrypoint is dist/src/main.js, NOT dist/main.js. apps/api has no
#    tsconfig.build.json, so its tsconfig `include` spans src/, test/ AND prisma/,
#    which makes tsc root the emit at the package directory.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
# openssl: required by the Prisma query engine. ca-certificates: outbound TLS to S3.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ---------------------------------------------------------------- dependencies --
FROM base AS deps
# Every workspace package.json must be present or --frozen-lockfile refuses to run.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json      apps/api/
COPY apps/web/package.json      apps/web/
COPY apps/crm/package.json      apps/crm/
RUN pnpm install --frozen-lockfile
# Fail loudly if a postinstall was skipped, rather than at runtime.
RUN node -e "require.resolve('esbuild')" \
 || (echo 'esbuild postinstall was skipped — check the pnpm version' && exit 1)

# --------------------------------------------------------------------- builder --
FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/api      apps/api
# shared first: the API imports its zod schemas and CacheTags as runtime VALUES,
# so dist/index.cjs must exist before nest build and must ship in the image.
RUN pnpm --filter @alcha/shared build \
 && pnpm --filter @alcha/api build
# Prove the engine for this platform was generated; a missing one only shows up
# at the first query otherwise.
RUN ls node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/ | grep -q 'libquery_engine' \
 || (echo 'Prisma query engine missing after generate' && exit 1)

# --------------------------------------------------------------------- runtime --
FROM base AS runtime
ENV NODE_ENV=production
# Copying the whole /app preserves pnpm's symlink farm. Copying apps/api/node_modules
# alone does not work: it is a tree of links into the root .pnpm store, and the
# generated Prisma client lives in that store, not under apps/api.
COPY --from=builder /app /app
WORKDIR /app/apps/api

# Node 22 has global fetch, so the healthcheck needs no curl in the image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

EXPOSE 4000
# Exec form so Node receives SIGTERM directly as PID 1.
CMD ["node", "dist/src/main.js"]
