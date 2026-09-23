# syntax=docker/dockerfile:1
#
# @alcha/web — Next.js 15 (SSG + ISR).
# Built from the REPO ROOT:
#   docker build -f apps/web/Dockerfile -t alcha-web .
#
# TWO THINGS ABOUT THIS BUILD ARE UNUSUAL — read before editing:
#
# 1. NEXT_PUBLIC_* are INLINED INTO THE BUNDLE AT BUILD TIME. They are build args,
#    not runtime env. Changing the site or API URL means rebuilding the image; a
#    `docker compose up -d` with new env does nothing. The image is therefore tied
#    to one environment.
#
# 2. `next build` PRERENDERS BY FETCHING THE LIVE API. lib/content.ts falls back to
#    blank copy when that fetch fails and the build still exits 0 — so a build with
#    the API down silently produces a site with no hero, no pricing and no case
#    studies. The API and Postgres must be up, migrated and SEEDED before this runs.
#    deploy.sh builds with --network so http://api:4000 resolves.
#
# devDependencies stay in the runtime image on purpose: `next start` re-executes
# next.config.ts through its TypeScript loader, which requires `typescript` and
# `dotenv` to be resolvable. A --prod prune makes the container fail at BOOT, and
# Next will try to npm-install TypeScript at startup. (output: 'standalone' would
# avoid this by inlining the config, but it needs its own plumbing for the pnpm
# symlink layout — deliberately not done yet.)

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# ---------------------------------------------------------------- dependencies --
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json      apps/api/
COPY apps/web/package.json      apps/web/
COPY apps/crm/package.json      apps/crm/
# Installed inside the Linux image so the correct @next/swc-linux-* and
# @img/sharp-linux-* binaries are fetched. Copying host node_modules from a Mac
# yields "Could not load the sharp module".
RUN pnpm install --frozen-lockfile
# Checked in the .pnpm store, not via require.resolve: pnpm does not hoist.
RUN bin=$(ls -d node_modules/.pnpm/esbuild@*/node_modules/esbuild/bin/esbuild 2>/dev/null | head -1); \
    if [ -z "$bin" ] || [ ! -x "$bin" ]; then \
      echo 'esbuild binary missing — a lifecycle script was skipped (check the pnpm version)'; exit 1; \
    fi; \
    echo "esbuild ok: $bin"

# --------------------------------------------------------------------- builder --
FROM deps AS builder
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_GA_ID=""
ARG NEXT_PUBLIC_YANDEX_METRIKA_ID=""
ARG NEXT_PUBLIC_GSC_VERIFICATION=""
ARG NEXT_PUBLIC_YANDEX_VERIFICATION=""
# Server-side fetch base used for the prerender. Points at the compose service.
ARG API_INTERNAL_URL=http://api:4000
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_YANDEX_METRIKA_ID=$NEXT_PUBLIC_YANDEX_METRIKA_ID \
    NEXT_PUBLIC_GSC_VERIFICATION=$NEXT_PUBLIC_GSC_VERIFICATION \
    NEXT_PUBLIC_YANDEX_VERIFICATION=$NEXT_PUBLIC_YANDEX_VERIFICATION \
    API_INTERNAL_URL=$API_INTERNAL_URL \
    NODE_ENV=production

COPY packages/shared packages/shared
COPY apps/web      apps/web
# shared must be built first: apps/web resolves @alcha/shared through ./dist.
RUN pnpm --filter @alcha/shared build
# Filtered rather than `turbo run build`: turbo runs in strict env mode and would
# strip API_INTERNAL_URL from the task environment. Node heap is capped so a large
# build GCs instead of being OOM-killed on a 4 GB box.
RUN NODE_OPTIONS=--max-old-space-size=2048 pnpm --filter @alcha/web build

# --------------------------------------------------------------------- runtime --
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=builder /app /app
WORKDIR /app/apps/web

# ISR writes revalidated pages back into .next/server/app and the fetch/image
# caches into .next/cache, so this tree must stay writable — do not set
# read_only: true on this service.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

EXPOSE 3000
# `next start -p 3000` — the port is hardcoded in the package script, so a PORT
# env var on this service would be ignored. Caddy must target 3000.
CMD ["pnpm", "start"]
