#!/usr/bin/env bash
set -euo pipefail

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump command is required but not found." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/ops/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="$BACKUP_DIR/linguistpro_${TIMESTAMP}.dump"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
DRY_RUN="${DRY_RUN:-0}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required for backups." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] pg_dump \"\$DATABASE_URL\" --format=custom --no-owner --no-privileges --file \"$BACKUP_FILE\""
  echo "[dry-run] compute checksum for $BACKUP_FILE"
  echo "[dry-run] prune backup artifacts older than $RETENTION_DAYS days in $BACKUP_DIR"
  exit 0
fi

pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$BACKUP_FILE"

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
else
  shasum -a 256 "$BACKUP_FILE" > "$CHECKSUM_FILE"
fi

find "$BACKUP_DIR" -type f -name "linguistpro_*.dump" -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name "linguistpro_*.dump.sha256" -mtime +"$RETENTION_DAYS" -delete

echo "Backup created: $BACKUP_FILE"
echo "Checksum file: $CHECKSUM_FILE"
