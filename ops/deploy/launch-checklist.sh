#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORT_DIR="${REPORT_DIR:-$ROOT_DIR/ops/deploy/reports}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/launch-checklist-${TIMESTAMP}.md"

BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/ops/backups}"
MAX_BACKUP_AGE_HOURS="${MAX_BACKUP_AGE_HOURS:-24}"

STAGING_UAT_SIGNED_OFF="${STAGING_UAT_SIGNED_OFF:-false}"
CI_GREEN="${CI_GREEN:-false}"

RUN_PREFLIGHT="${RUN_PREFLIGHT:-1}"
ENV_FILE="${ENV_FILE:-}"
DRY_RUN="${DRY_RUN:-0}"
PRODUCTION_BASE_URL="${PRODUCTION_BASE_URL:-}"

pass_count=0
fail_count=0
report_rows=()

record_pass() {
  local step="$1"
  local detail="$2"
  pass_count=$((pass_count + 1))
  report_rows+=("| ${step} | PASS | ${detail} |")
}

record_fail() {
  local step="$1"
  local detail="$2"
  fail_count=$((fail_count + 1))
  report_rows+=("| ${step} | FAIL | ${detail} |")
}

mkdir -p "$REPORT_DIR"

if [[ "$STAGING_UAT_SIGNED_OFF" == "true" ]]; then
  record_pass "Staging sign-off" "STAGING_UAT_SIGNED_OFF=true"
else
  record_fail "Staging sign-off" "Set STAGING_UAT_SIGNED_OFF=true only after real staging UAT approval"
fi

if [[ "$CI_GREEN" == "true" ]]; then
  record_pass "CI status" "CI_GREEN=true"
else
  record_fail "CI status" "Set CI_GREEN=true after verifying required checks are green"
fi

latest_backup="$(ls -1t "$BACKUP_DIR"/linguistpro_*.dump 2>/dev/null | head -n 1 || true)"
if [[ -z "$latest_backup" ]]; then
  record_fail "Backup freshness" "No backup dump found in $BACKUP_DIR"
else
  now_epoch="$(date +%s)"
  backup_epoch="$(stat -c %Y "$latest_backup")"
  age_hours="$(( (now_epoch - backup_epoch) / 3600 ))"
  if (( age_hours <= MAX_BACKUP_AGE_HOURS )); then
    record_pass "Backup freshness" "Latest backup $(basename "$latest_backup") age=${age_hours}h"
  else
    record_fail "Backup freshness" "Latest backup $(basename "$latest_backup") is too old (${age_hours}h)"
  fi
fi

if [[ "$DRY_RUN" == "1" ]]; then
  record_pass "Deploy preflight" "Skipped command execution (DRY_RUN=1)"
  record_pass "Production smoke" "Skipped command execution (DRY_RUN=1)"
else
  if [[ "$RUN_PREFLIGHT" == "1" ]]; then
    if [[ -n "$ENV_FILE" ]]; then
      if NODE_ENV=production ENV_FILE="$ENV_FILE" npm run ops:deploy:preflight >/tmp/launch_preflight.log 2>&1; then
        record_pass "Deploy preflight" "ops:deploy:preflight passed (ENV_FILE=$ENV_FILE)"
      else
        preflight_tail="$(tail -n 20 /tmp/launch_preflight.log | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')"
        record_fail "Deploy preflight" "$preflight_tail"
      fi
    else
      if NODE_ENV=production npm run ops:deploy:preflight >/tmp/launch_preflight.log 2>&1; then
        record_pass "Deploy preflight" "ops:deploy:preflight passed"
      else
        preflight_tail="$(tail -n 20 /tmp/launch_preflight.log | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')"
        record_fail "Deploy preflight" "$preflight_tail"
      fi
    fi
  else
    record_pass "Deploy preflight" "Skipped command execution (RUN_PREFLIGHT=0)"
  fi

  if [[ -n "$PRODUCTION_BASE_URL" ]]; then
    if STAGING_BASE_URL="$PRODUCTION_BASE_URL" npm run ops:uat:smoke >/tmp/launch_smoke.log 2>&1; then
      record_pass "Production smoke" "ops:uat:smoke passed at $PRODUCTION_BASE_URL"
    else
      smoke_tail="$(tail -n 20 /tmp/launch_smoke.log | tr '\n' ' ' | sed 's/[[:space:]]\+/ /g')"
      record_fail "Production smoke" "$smoke_tail"
    fi
  else
    record_fail "Production smoke" "Set PRODUCTION_BASE_URL to run read-only smoke checks"
  fi
fi

{
  echo "# Production Launch Checklist Report"
  echo
  echo "- Timestamp (UTC): $TIMESTAMP"
  echo "- Branch: $(git -C "$ROOT_DIR" branch --show-current)"
  echo "- Commit: $(git -C "$ROOT_DIR" rev-parse --short HEAD)"
  echo "- Pass: $pass_count"
  echo "- Fail: $fail_count"
  echo
  echo "| Step | Result | Detail |"
  echo "|---|---|---|"
  for row in "${report_rows[@]}"; do
    echo "$row"
  done
} > "$REPORT_FILE"

echo "Launch checklist report written to: $REPORT_FILE"
echo "Pass: $pass_count, Fail: $fail_count"

if (( fail_count > 0 )); then
  exit 1
fi

