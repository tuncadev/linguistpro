#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${STAGING_BASE_URL:-${1:-http://127.0.0.1:3001}}"
REPORT_DIR="${REPORT_DIR:-ops/uat/reports}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/uat-smoke-${TIMESTAMP}.md"

mkdir -p "$REPORT_DIR"

pass_count=0
fail_count=0
warn_count=0
report_rows=()

check_endpoint() {
  local kind="$1"
  local path="$2"
  local expected_csv="$3"
  local expect_json="${4:-0}"
  local full_url="${BASE_URL%/}${path}"
  local http_code
  local content_type

  http_code="$(curl -sS -D /tmp/uat_smoke_headers.$$ -o /tmp/uat_smoke_body.$$ -w "%{http_code}" "$full_url" || true)"
  content_type="$(
    awk -F': ' 'tolower($1)=="content-type" {print tolower($2); exit}' /tmp/uat_smoke_headers.$$ | tr -d '\r'
  )"
  rm -f /tmp/uat_smoke_body.$$
  rm -f /tmp/uat_smoke_headers.$$

  IFS=',' read -r -a expected_codes <<< "$expected_csv"
  local matched=0
  for code in "${expected_codes[@]}"; do
    if [[ "$http_code" == "$code" ]]; then
      matched=1
      break
    fi
  done

  if [[ "$matched" -eq 1 ]]; then
    if [[ "$expect_json" == "1" && "$content_type" != *"application/json"* ]]; then
      if [[ "$kind" == "optional" ]]; then
        warn_count=$((warn_count + 1))
        report_rows+=("| ${kind} | \`${path}\` | ${http_code} | WARN (expected JSON response) |")
        return
      fi

      fail_count=$((fail_count + 1))
      report_rows+=("| ${kind} | \`${path}\` | ${http_code} | FAIL (expected JSON response) |")
      return
    fi

    pass_count=$((pass_count + 1))
    report_rows+=("| ${kind} | \`${path}\` | ${http_code} | PASS |")
    return
  fi

  if [[ "$kind" == "optional" ]]; then
    warn_count=$((warn_count + 1))
    report_rows+=("| ${kind} | \`${path}\` | ${http_code} | WARN (expected ${expected_csv}) |")
    return
  fi

  fail_count=$((fail_count + 1))
  report_rows+=("| ${kind} | \`${path}\` | ${http_code} | FAIL (expected ${expected_csv}) |")
}

check_endpoint "required" "/" "200"
check_endpoint "required" "/about" "200"
check_endpoint "required" "/courses" "200"
check_endpoint "optional" "/api/health" "200" "1"
check_endpoint "optional" "/api/courses" "200,401,403" "1"

{
  echo "# UAT Smoke Report"
  echo
  echo "- Timestamp (UTC): ${TIMESTAMP}"
  echo "- Base URL: ${BASE_URL}"
  echo "- Required failures: ${fail_count}"
  echo "- Optional warnings: ${warn_count}"
  echo
  echo "| Type | Path | Status | Result |"
  echo "|---|---|---:|---|"
  for row in "${report_rows[@]}"; do
    echo "$row"
  done
} > "$REPORT_FILE"

echo "Smoke report written to: $REPORT_FILE"
echo "Pass: $pass_count, Fail: $fail_count, Warn: $warn_count"

if [[ "$fail_count" -gt 0 ]]; then
  exit 1
fi
