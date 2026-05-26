#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${SYNTHETIC_BASE_URL:-http://127.0.0.1:3001}"
REPORT_DIR="${SYNTHETIC_REPORT_DIR:-ops/uat/reports}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_FILE="$REPORT_DIR/synthetic-check-${TIMESTAMP}.md"

mkdir -p "$REPORT_DIR"

health_status="$(curl -sS -o /tmp/linguistpro_synth_health.json -w "%{http_code}" "$BASE_URL/api/health" || true)"
metrics_status="$(curl -sS -o /tmp/linguistpro_synth_metrics.json -w "%{http_code}" "$BASE_URL/api/metrics" || true)"

status="PASS"
if [[ "$health_status" != "200" ]]; then
  status="FAIL"
fi
if [[ "$metrics_status" != "200" && "$metrics_status" != "401" ]]; then
  status="FAIL"
fi

{
  echo "# Synthetic Monitoring Report"
  echo ""
  echo "- Generated: $TIMESTAMP"
  echo "- Base URL: $BASE_URL"
  echo "- Status: $status"
  echo ""
  echo "## Endpoint Results"
  echo ""
  echo "| Endpoint | HTTP | Expectation | Result |"
  echo "| --- | --- | --- | --- |"
  if [[ "$health_status" == "200" ]]; then
    echo "| /api/health | $health_status | 200 | PASS |"
  else
    echo "| /api/health | $health_status | 200 | FAIL |"
  fi
  if [[ "$metrics_status" == "200" || "$metrics_status" == "401" ]]; then
    echo "| /api/metrics | $metrics_status | 200 or 401 | PASS |"
  else
    echo "| /api/metrics | $metrics_status | 200 or 401 | FAIL |"
  fi
} >"$REPORT_FILE"

echo "Synthetic report: $REPORT_FILE"

if [[ "$status" != "PASS" ]]; then
  exit 1
fi
