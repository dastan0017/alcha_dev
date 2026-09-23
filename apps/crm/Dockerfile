# syntax=docker/dockerfile:1
#
# @alcha/crm — React + Vite admin. Built from the REPO ROOT:
#   docker build -f apps/crm/Dockerfile -t alcha-crm .
#
# The CRM is a pure static bundle with no server of its own, so this image is not
# a long-running service. It is a one-shot: on start it copies the built assets
# into a volume that Caddy serves at admin.alcha.dev, then exits 0.
#
# Serving it from Caddy rather than Netlify is deliberate. admin.alcha.dev is
# same-site with api.alcha.dev, so the existing `sameSite: 'lax'` refresh cookie
# works unchanged — on a *.netlify.app origin the browser withholds it and the
# admin is logged out on every page reload. Caddy's `try_files ... /index.html`
# also supplies the SPA fallback the repo never had.
#
# VITE_* are INLINED AT BUILD TIME, so they are build args. They are also part of
# turbo's cache key now (they were in globalPassThroughEnv, which meant a cached
# dist could be replayed with a stale API URL baked in).

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json turbo.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json      apps/api/
COPY apps/web/package.json      apps/web/
COPY apps/crm/package.json      apps/crm/
RUN pnpm install --frozen-lockfile

ARG VITE_API_URL
ARG VITE_SITE_URL
ENV VITE_API_URL=$VITE_API_URL VITE_SITE_URL=$VITE_SITE_URL

COPY packages/shared packages/shared
COPY apps/crm      apps/crm
# shared first — the CRM's `tsc -b` fails with TS2307 without dist/index.d.ts.
RUN pnpm --filter @alcha/shared build \
 && pnpm --filter @alcha/crm build
# The bundle must not contain a localhost API URL: that means a VITE_* build arg
# was missing and the code fell back to its dev default, which would ship an admin
# panel pointing at the visitor's own machine.
RUN grep -rq "localhost:4000" apps/crm/dist/assets/ \
 && (echo 'CRM bundle contains localhost:4000 — VITE_API_URL was not set' && exit 1) \
 || echo 'bundle URL check passed'

FROM alpine:3.20 AS runtime
COPY --from=builder /app/apps/crm/dist /crm-dist
# Replace the volume contents wholesale so removed files from a previous build
# do not linger and get served.
CMD ["sh", "-c", "rm -rf /srv/crm/* && cp -a /crm-dist/. /srv/crm/ && echo 'CRM assets published to /srv/crm' && ls /srv/crm"]
