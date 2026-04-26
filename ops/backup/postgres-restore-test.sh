#!/usr/bin/env bash
set -euo pipefail

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "pg_restore command is required but not found." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql command is required but not found." >&2
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/ops/backups}"
BACKUP_FILE="${1:-}"
DRY_RUN="${DRY_RUN:-0}"

if [[ -z "$BACKUP_FILE" ]]; then
  BACKUP_FILE="$(ls -1t "$BACKUP_DIR"/linguistpro_*.dump 2>/dev/null | head -n 1 || true)"
fi

if [[ -z "$BACKUP_FILE" ]]; then
  echo "No backup file found. Provide a backup path or run backup first." >&2
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file does not exist: $BACKUP_FILE" >&2
  exit 1
fi

if [[ -z "${RESTORE_TEST_DATABASE_URL:-}" ]]; then
  echo "RESTORE_TEST_DATABASE_URL is required for restore tests." >&2
  exit 1
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] reset schema in restore test database"
  echo "[dry-run] pg_restore --clean --if-exists --no-owner --no-privileges --dbname \"\$RESTORE_TEST_DATABASE_URL\" \"$BACKUP_FILE\""
  echo "[dry-run] run table existence checks"
  exit 0
fi

psql "$RESTORE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO CURRENT_USER;
SQL

pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --dbname="$RESTORE_TEST_DATABASE_URL" \
  "$BACKUP_FILE"

TABLE_CHECKS="$(psql "$RESTORE_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -At <<'SQL'
SELECT CASE WHEN to_regclass('"User"') IS NULL THEN 'missing:User' ELSE 'ok:User' END;
SELECT CASE WHEN to_regclass('"Course"') IS NULL THEN 'missing:Course' ELSE 'ok:Course' END;
SELECT CASE WHEN to_regclass('"Enrollment"') IS NULL THEN 'missing:Enrollment' ELSE 'ok:Enrollment' END;
SQL
)"

if echo "$TABLE_CHECKS" | grep -q "missing:"; then
  echo "Restore verification failed: required tables missing" >&2
  echo "$TABLE_CHECKS" >&2
  exit 1
fi

echo "Restore verification successful for: $BACKUP_FILE"
echo "$TABLE_CHECKS"
