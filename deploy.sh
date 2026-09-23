#!/usr/bin/env bash
#
# alcha.dev — production deploy. Run ON THE SERVER, from /opt/alcha.
#
#   ./deploy.sh          full deploy (pull, build, migrate, restart, verify)
#   ./deploy.sh --no-pull        skip git pull (deploy working tree as-is)
#   ./deploy.sh --skip-build     restart only, no image rebuild
#
# ORDERING IS LOAD-BEARING, not stylistic:
#   postgres -> migrate -> api healthy -> THEN build web
# `next build` prerenders by fetching the API. lib/content.ts falls back to blank
# copy on failure and the build still exits 0, so building before the API is up
# and seeded produces a green deploy of an empty website.
#
# This script NEVER runs `docker compose down -v`, `prisma migrate reset`, or the
# seed. Those destroy data. Seeding is a deliberate one-time action — see
# `seed-once.sh`.

set -euo pipefail

cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.prod.yml"
PROJECT=alcha
NETWORK="${PROJECT}_internal"
DO_PULL=1
DO_BUILD=1

for arg in "$@"; do
  case "$arg" in
    --no-pull)    DO_PULL=0 ;;
    --skip-build) DO_BUILD=0 ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

log()  { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31mFAILED: %s\033[0m\n' "$*" >&2; exit 1; }

[ -f .env ] || fail ".env not found in $(pwd). Copy .env.production.example and fill it in."
set -a; . ./.env; set +a

for v in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB DATABASE_URL JWT_SECRET \
         JWT_REFRESH_SECRET REVALIDATE_SECRET CORS_ORIGINS WEB_URL CRM_URL \
         NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_API_URL VITE_API_URL VITE_SITE_URL; do
  [ -n "${!v:-}" ] || fail "$v is empty in .env"
done

# ---------------------------------------------------------------- 1. get code --
if [ "$DO_PULL" = 1 ]; then
  log "Pulling latest code"
  git pull --ff-only
fi
git --no-pager log --oneline -1

# ------------------------------------------------------- 2. database + api up --
log "Starting Postgres and applying migrations"
$COMPOSE up -d postgres
$COMPOSE up --exit-code-from migrate migrate || fail "prisma migrate deploy failed — NOT continuing"

if [ "$DO_BUILD" = 1 ]; then
  log "Building the API image"
  docker build -f apps/api/Dockerfile -t alcha-api:latest . || fail "api image build failed"
fi

log "Starting the API"
$COMPOSE up -d api

log "Waiting for the API to report healthy (web's build depends on it)"
for i in $(seq 1 60); do
  status=$(docker inspect -f '{{.State.Health.Status}}' alcha_api 2>/dev/null || echo starting)
  [ "$status" = healthy ] && break
  [ "$i" = 60 ] && { $COMPOSE logs --tail=40 api; fail "API never became healthy"; }
  sleep 2
done
echo "API is healthy."

# Guard against the failure mode this whole ordering exists to prevent: if the API
# serves no content, a web build now would bake a blank site into the image.
log "Checking the API actually returns content"
probe=$(docker run --rm --network "$NETWORK" curlimages/curl:latest \
          -s --max-time 10 "http://api:4000/content/home?locale=ru" || true)
if [ -z "$probe" ] || ! echo "$probe" | grep -q '"hero"'; then
  echo "$probe" | head -c 300
  fail "API returned no usable home content. The database is probably unseeded — run ./seed-once.sh first. Refusing to build a blank site."
fi
echo "Content OK."

# ------------------------------------------------------------ 3. build the rest --
if [ "$DO_BUILD" = 1 ]; then
  log "Building the web image (API reachable at http://api:4000 via --network)"
  docker build -f apps/web/Dockerfile -t alcha-web:latest \
    --network "$NETWORK" \
    --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
    --build-arg NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" \
    --build-arg NEXT_PUBLIC_GA_ID="${NEXT_PUBLIC_GA_ID:-}" \
    --build-arg NEXT_PUBLIC_YANDEX_METRIKA_ID="${NEXT_PUBLIC_YANDEX_METRIKA_ID:-}" \
    --build-arg NEXT_PUBLIC_GSC_VERIFICATION="${NEXT_PUBLIC_GSC_VERIFICATION:-}" \
    --build-arg NEXT_PUBLIC_YANDEX_VERIFICATION="${NEXT_PUBLIC_YANDEX_VERIFICATION:-}" \
    --build-arg API_INTERNAL_URL="http://api:4000" \
    . || fail "web image build failed"

  log "Building the CRM image"
  docker build -f apps/crm/Dockerfile -t alcha-crm:latest \
    --build-arg VITE_API_URL="$VITE_API_URL" \
    --build-arg VITE_SITE_URL="$VITE_SITE_URL" \
    . || fail "crm image build failed"
fi

# ------------------------------------------------------------------ 4. bring up --
log "Publishing the CRM bundle"
$COMPOSE up --exit-code-from crm crm || fail "CRM publish failed"

log "Starting web and Caddy"
$COMPOSE up -d web caddy

log "Waiting for web to report healthy"
for i in $(seq 1 60); do
  status=$(docker inspect -f '{{.State.Health.Status}}' alcha_web 2>/dev/null || echo starting)
  [ "$status" = healthy ] && break
  [ "$i" = 60 ] && { $COMPOSE logs --tail=40 web; fail "web never became healthy"; }
  sleep 2
done
echo "web is healthy."

# ------------------------------------------------------------------- 5. warm up --
# A fresh image serves the HTML captured at build time. Revalidated pages live in
# .next/server/app INSIDE the container, so they do not survive a redeploy — this
# pulls current content back in immediately instead of waiting out the 1h timer.
log "Revalidating and warming the cache"
curl -fsS -X POST "${WEB_URL}/api/revalidate" \
  -H 'content-type: application/json' \
  -H "x-revalidate-secret: ${REVALIDATE_SECRET}" \
  -d '{"tags":["content:home","content:chrome","content:settings","content:projects"]}' \
  >/dev/null && echo "revalidate accepted" || echo "WARNING: revalidate failed (site will refresh within the hour)"
for p in / /en /sitemap.xml; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "${WEB_URL}${p}" || echo 000)
  printf '  warm %-14s %s\n' "$p" "$code"
done

# -------------------------------------------------------------------- 6. verify --
log "Service status"
$COMPOSE ps

log "Public endpoints"
for u in "https://alcha.dev" "https://www.alcha.dev" "https://api.alcha.dev/health" "https://admin.alcha.dev"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$u" || echo 000)
  printf '  %-34s %s\n' "$u" "$code"
done

log "Deploy complete"
