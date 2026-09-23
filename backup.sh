#!/usr/bin/env bash
#
# alcha.dev — PostgreSQL backup. Run ON THE SERVER, from /opt/alcha.
#
#   ./backup.sh              take a backup now
#   ./backup.sh --list       list what exists locally
#
# Installed as a daily cron job (see the bottom of this file for the entry).
#
# The database is tiny — the fully seeded schema is ~10 MB, of which the real
# payload is ~22 KB of bilingual copy — so a full pg_dump costs nothing and there
# is no reason for anything cleverer than this.
#
# Backups are written locally and, IF S3 credentials are configured, mirrored to
# the media bucket under backups/. Local copies are pruned after RETAIN_DAYS;
# this NEVER touches the database or its volume.
#
# RESTORE (read this before you need it):
#   gunzip -c backups/alcha-YYYYmmdd-HHMMSS.sql.gz \
#     | docker exec -i alcha_postgres psql -U alcha -d alcha
# To restore into a clean database instead, stop the api first so nothing writes
# during the load:
#   docker compose -f docker-compose.prod.yml stop api web
#   docker exec -i alcha_postgres psql -U alcha -c 'DROP DATABASE alcha;'
#   docker exec -i alcha_postgres psql -U alcha -c 'CREATE DATABASE alcha;'
#   gunzip -c <dump> | docker exec -i alcha_postgres psql -U alcha -d alcha
#   docker compose -f docker-compose.prod.yml start api web

set -euo pipefail
cd "$(dirname "$0")"

RETAIN_DAYS=14
DIR=backups

load_env() {
  local line key val
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|\#*) continue ;; esac
    [ "${line#*=}" = "$line" ] && continue
    key=${line%%=*}; val=${line#*=}
    case "$val" in \"*\") val=${val#\"}; val=${val%\"} ;; esac
    export "$key=$val"
  done < "$1"
}
load_env ./.env

mkdir -p "$DIR"

if [ "${1:-}" = "--list" ]; then
  ls -lh "$DIR"/*.sql.gz 2>/dev/null || echo "no backups yet"
  exit 0
fi

STAMP=$(date -u +%Y%m%d-%H%M%S)
FILE="$DIR/alcha-${STAMP}.sql.gz"

# -Fp (plain SQL) rather than a custom-format dump: it restores with plain psql,
# needs no pg_restore version match, and gzips to almost nothing at this size.
docker exec -t alcha_postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \
  | gzip -9 > "$FILE"

# A dump that fails midway still leaves a valid gzip, so check the content.
if ! gunzip -c "$FILE" | grep -q 'PostgreSQL database dump complete'; then
  echo "BACKUP FAILED — dump is truncated, removing $FILE" >&2
  rm -f "$FILE"
  exit 1
fi
echo "$(date -u +%FT%TZ) ok $FILE ($(du -h "$FILE" | cut -f1))"

# Optional off-box copy. Skipped while S3 still holds placeholder credentials.
if [ -n "${S3_BUCKET:-}" ] && [ "${S3_ACCESS_KEY:-placeholder}" != "placeholder" ]; then
  docker run --rm -e AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY" \
    -e AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY" -e AWS_DEFAULT_REGION="$S3_REGION" \
    -v "$(pwd)/$DIR:/b:ro" amazon/aws-cli:latest \
    s3 cp "/b/$(basename "$FILE")" "s3://${S3_BUCKET}/backups/$(basename "$FILE")" \
    --storage-class STANDARD_IA >/dev/null \
    && echo "  mirrored to s3://${S3_BUCKET}/backups/" \
    || echo "  WARNING: S3 upload failed; local copy is fine"
else
  echo "  (S3 not configured — local copy only)"
fi

# Prune local copies only. Never touches the pgdata volume.
find "$DIR" -name 'alcha-*.sql.gz' -mtime "+${RETAIN_DAYS}" -print -delete

# Install the daily job with:
#   (crontab -l 2>/dev/null; echo '17 3 * * * cd /opt/alcha && ./backup.sh >> /opt/alcha/backups/backup.log 2>&1') | crontab -
