#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SECURITY_BASE_URL:-http://127.0.0.1:3001}"
REPORT_DIR="${SECURITY_REPORT_DIR:-ops/secrets/reports}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/security-smoke-${TIMESTAMP}.md"

mkdir -p "$REPORT_DIR"

headers="$(curl -sSI "$BASE_URL/" || true)"

required_headers=(
  "x-content-type-options: nosniff"
  "x-frame-options: DENY"
  "referrer-policy: strict-origin-when-cross-origin"
  "permissions-policy: camera=(), microphone=(), geolocation=()"
  "content-security-policy:"
)

status="PASS"
results=()

for header in "${required_headers[@]}"; do
  if grep -iq "$header" <<<"$headers"; then
    results+=("| ${header} | PASS | present |")
  else
    status="FAIL"
    results+=("| ${header} | FAIL | missing |")
  fi
done

{
  echo "# Security Smoke Report"
  echo ""
  echo "- Generated: $TIMESTAMP"
  echo "- Base URL: $BASE_URL"
  echo "- Status: $status"
  echo ""
  echo "## Header Checks"
  echo ""
  echo "| Header | Result | Note |"
  echo "| --- | --- | --- |"
  printf '%s\n' "${results[@]}"
} >"$REPORT_FILE"

echo "Security smoke report: $REPORT_FILE"

if [[ "$status" != "PASS" ]]; then
  exit 1
fi
