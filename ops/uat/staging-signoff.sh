#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE_URL="${STAGING_BASE_URL:-${1:-}}"

if [[ -z "$BASE_URL" ]]; then
  echo "STAGING_BASE_URL (or first script arg) is required." >&2
  exit 1
fi

QA_OWNER="${QA_OWNER:-_pending_}"
PRODUCT_OWNER="${PRODUCT_OWNER:-_pending_}"
NOTES="${NOTES:-Automated staging UAT run}"

REPORT_DIR="${REPORT_DIR:-$ROOT_DIR/ops/uat/reports}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SUMMARY_FILE="$REPORT_DIR/staging-signoff-${TIMESTAMP}.md"

mkdir -p "$REPORT_DIR"

smoke_status=0
roles_status=0

smoke_output="$(
  STAGING_BASE_URL="$BASE_URL" bash "$ROOT_DIR/ops/uat/smoke-check.sh" 2>&1
)" || smoke_status=$?

roles_output="$(
  STAGING_BASE_URL="$BASE_URL" bash "$ROOT_DIR/ops/uat/role-flow-check.sh" 2>&1
)" || roles_status=$?

smoke_report="$(printf "%s\n" "$smoke_output" | sed -n 's/^Smoke report written to: //p' | tail -n 1)"
roles_report="$(printf "%s\n" "$roles_output" | sed -n 's/^Role-flow report written to: //p' | tail -n 1)"

if [[ -z "$smoke_report" ]]; then
  smoke_report="(not generated)"
fi
if [[ -z "$roles_report" ]]; then
  roles_report="(not generated)"
fi

if [[ "$smoke_status" -eq 0 && "$roles_status" -eq 0 ]]; then
  result="PASS"
else
  result="FAIL"
fi

date_utc="$(date -u +%Y-%m-%d)"
report_cell="smoke: \`${smoke_report}\`<br>roles: \`${roles_report}\`"
row_snippet="| ${date_utc} | \`${BASE_URL}\` | ${report_cell} | ${QA_OWNER} | ${PRODUCT_OWNER} | ${result} | ${NOTES} |"

{
  echo "# Staging UAT Sign-Off Summary"
  echo
  echo "- Timestamp (UTC): ${TIMESTAMP}"
  echo "- Base URL: ${BASE_URL}"
  echo "- Result: ${result}"
  echo "- Smoke status: ${smoke_status}"
  echo "- Roles status: ${roles_status}"
  echo "- Smoke report: ${smoke_report}"
  echo "- Role-flow report: ${roles_report}"
  echo
  echo "## Sign-Off Row Snippet"
  echo
  echo "$row_snippet"
  echo
  echo "## Smoke Output"
  echo
  echo '```text'
  echo "$smoke_output"
  echo '```'
  echo
  echo "## Role-Flow Output"
  echo
  echo '```text'
  echo "$roles_output"
  echo '```'
} > "$SUMMARY_FILE"

echo "Staging sign-off summary written to: $SUMMARY_FILE"
echo "$row_snippet"

if [[ "$result" == "FAIL" ]]; then
  exit 1
fi

