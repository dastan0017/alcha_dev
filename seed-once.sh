#!/usr/bin/env bash
#
# alcha.dev — ONE-TIME production seed. Run ON THE SERVER, from /opt/alcha.
#
#   !!  THIS IS DESTRUCTIVE IF RUN TWICE  !!
#
# prisma/seed.ts calls wipeContent(), which deleteMany()s ProcessStep, Project,
# PricingPlan, SeoMeta, HomeContent, SiteChrome, SiteSettings and ContentDraft in
# one transaction before recreating them from the checked-in copy deck. Running it
# again after the site is live DELETES EVERY EDIT MADE IN THE CRM.
#
# It also upserts the admin user with `update: { passwordHash }`, so a second run
# silently resets the admin password back to SEED_ADMIN_PASSWORD.
#
# It is separate from deploy.sh for exactly this reason. deploy.sh must never seed.
#
# Uses the COMPILED seed (dist/prisma/seed.js) rather than `pnpm db:seed`: the
# packaged script wraps prisma in dotenv-cli and tsx and expects a root .env that
# does not exist in a container.

set -euo pipefail
cd "$(dirname "$0")"

# --yes skips the confirmation on a FRESH database only. It deliberately refuses
# to proceed when content already exists — a non-interactive wipe is never safe.
ASSUME_YES=0
for a in "$@"; do
  case "$a" in
    --yes) ASSUME_YES=1 ;;
    *) echo "unknown flag: $a" >&2; exit 2 ;;
  esac
done

COMPOSE="docker compose -f docker-compose.prod.yml"

[ -f .env ] || { echo ".env not found" >&2; exit 1; }

# Parse, don't source: DATABASE_URL contains '&' and bash would treat it as a
# command separator, truncating the value.
load_env() {
  local line key val
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|\#*) continue ;; esac
    [ "${line#*=}" = "$line" ] && continue
    key=${line%%=*}
    val=${line#*=}
    case "$val" in
      \"*\") val=${val#\"}; val=${val%\"} ;;
      \'*\') val=${val#\'}; val=${val%\'} ;;
    esac
    export "$key=$val"
  done < "$1"
}
load_env ./.env

if [ "${SEED_ADMIN_PASSWORD:-}" = "changeme123" ] || [ -z "${SEED_ADMIN_PASSWORD:-}" ]; then
  echo "REFUSING: SEED_ADMIN_PASSWORD is unset or still the default 'changeme123'." >&2
  echo "Set a real password in .env first — this creates your production admin login." >&2
  exit 1
fi

echo "Checking whether content already exists..."
# </dev/null matters: `docker compose run` would otherwise swallow this script's
# stdin, so a later `read` sees EOF, returns non-zero, and `set -e` kills the run
# with no message at all.
existing=$($COMPOSE run --rm --no-deps -T \
  -e DATABASE_URL="$DATABASE_URL" \
  --entrypoint node api \
  -e 'const{PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.homeContent.count().then(n=>{console.log(n);return p.$disconnect()}).catch(()=>{console.log(0)})' \
  </dev/null 2>/dev/null | tr -dc '0-9' || echo 0)

if [ "${existing:-0}" != "0" ]; then
  cat >&2 <<WARN

  The database already contains content ($existing HomeContent row(s)).
  Seeding now would DELETE it, including every edit made in the CRM.

WARN
  if [ "$ASSUME_YES" = 1 ]; then
    echo "REFUSING: --yes will not wipe existing content. Re-run interactively if you truly mean it." >&2
    exit 1
  fi
  read -r -p "Type SEED-AND-WIPE to proceed anyway: " confirm || confirm=""
  [ "$confirm" = "SEED-AND-WIPE" ] || { echo "Aborted."; exit 1; }
else
  echo "Database has no content — safe to seed."
  if [ "$ASSUME_YES" != 1 ]; then
    read -r -p "Seed production now? [y/N] " confirm || confirm=""
    [ "$confirm" = "y" ] || [ "$confirm" = "Y" ] || { echo "Aborted."; exit 1; }
  fi
fi

echo "Seeding..."
$COMPOSE run --rm --no-deps -T \
  -e DATABASE_URL="$DATABASE_URL" \
  -e SEED_ADMIN_EMAIL="$SEED_ADMIN_EMAIL" \
  -e SEED_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
  --entrypoint node api dist/prisma/seed.js

cat <<DONE

Seed complete.

  Admin login:  ${SEED_ADMIN_EMAIL}  at https://admin.alcha.dev

NEXT: the seeded SiteSettings carry placeholder contact links marked
'// TODO(dastan)' in prisma/seed.ts — telegram, whatsapp, github, linkedin and a
cvUrl of /cv/dastan-rakhmanzhanov.pdf that will 404. Fix them in the CRM under
Settings, then Publish. Do NOT re-run this script to change them.
DONE
