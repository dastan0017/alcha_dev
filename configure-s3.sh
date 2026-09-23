#!/usr/bin/env bash
#
# alcha.dev — wire real S3 credentials into the production .env. Run ON THE
# SERVER, from /opt/alcha. Prompts for the values so they are never passed as
# arguments (which would land in your shell history and in `ps` output).
#
# These are RUNTIME-only variables: this needs an api restart, not a rebuild.
#
# Three values here are easy to get subtly wrong, and each fails in a way that
# looks like something else:
#   S3_ENDPOINT        must be PRESENT but EMPTY for real AWS. If the line is
#                      missing entirely the zod schema substitutes
#                      http://localhost:9000 and the API mints presigned URLs
#                      pointing at its own loopback — with no error anywhere.
#   S3_FORCE_PATH_STYLE must be the literal string `false`. Blank fails the zod
#                      enum and the API will not boot at all.
#   S3_PUBLIC_URL      is CONCATENATED INTO MediaAsset.url rows at upload time,
#                      so changing it later is a data migration, not a config
#                      edit. Get it right the first time.

set -euo pipefail
cd "$(dirname "$0")"

[ -f .env ] || { echo ".env not found — run this from /opt/alcha" >&2; exit 1; }

read -r -p "S3 bucket name: " BUCKET
read -r -p "AWS region [eu-north-1]: " REGION
REGION=${REGION:-eu-north-1}
read -r -p "AWS_ACCESS_KEY_ID: " AKID
read -r -s -p "AWS_SECRET_ACCESS_KEY (hidden): " SECRET; echo

[ -n "$BUCKET" ] && [ -n "$AKID" ] && [ -n "$SECRET" ] || { echo "all fields are required" >&2; exit 1; }

PUBLIC_URL="https://${BUCKET}.s3.${REGION}.amazonaws.com"

cp .env ".env.bak.$(date -u +%Y%m%d-%H%M%S)"

# Rewrite rather than sed: secret keys contain /, + and = in arbitrary
# combinations, and every sed delimiter choice is one bad character away from
# either a syntax error or — worse — a silent no-op that leaves the placeholder
# in place and looks like it worked.
set_kv() {
  local k="$1" v="$2"
  grep -v "^${k}=" .env > .env.tmp || true
  printf '%s=%s\n' "$k" "$v" >> .env.tmp
  mv .env.tmp .env
}

set_kv S3_ENDPOINT ""
set_kv S3_REGION "$REGION"
set_kv S3_BUCKET "$BUCKET"
set_kv S3_FORCE_PATH_STYLE "false"
set_kv S3_ACCESS_KEY "$AKID"
set_kv S3_SECRET_KEY "$SECRET"
set_kv S3_PUBLIC_URL "$PUBLIC_URL"
chmod 600 .env

echo
echo "Written (secrets withheld):"
grep -E '^S3_(ENDPOINT|REGION|BUCKET|FORCE_PATH_STYLE|PUBLIC_URL)=' .env
echo "  S3_ACCESS_KEY / S3_SECRET_KEY set."
echo
echo "Restarting the API to pick them up..."
docker compose -f docker-compose.prod.yml up -d --force-recreate api
for i in $(seq 1 45); do
  s=$(docker inspect -f '{{.State.Health.Status}}' alcha_api 2>/dev/null || echo starting)
  [ "$s" = healthy ] && break
  sleep 2
done
echo "api: $(docker inspect -f '{{.State.Status}} / {{.State.Health.Status}}' alcha_api)"
echo
echo "Now verify an actual upload end to end:"
echo "  log in at https://admin.alcha.dev, open Media, and upload an image."
echo "A 400 on the PUT means the bucket CORS rule is missing;"
echo "a 403 means the IAM policy does not cover s3:PutObject on ${BUCKET}/uploads/*."
