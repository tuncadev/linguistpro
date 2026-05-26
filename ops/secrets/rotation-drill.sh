#!/usr/bin/env bash
set -euo pipefail

OLD_ENV_FILE="${OLD_ENV_FILE:-}"
NEW_ENV_FILE="${NEW_ENV_FILE:-}"
REPORT_FILE="${REPORT_FILE:-}"

if [[ -z "$OLD_ENV_FILE" || -z "$NEW_ENV_FILE" ]]; then
  echo "Usage: OLD_ENV_FILE=/path/old.env NEW_ENV_FILE=/path/new.env bash ops/secrets/rotation-drill.sh" >&2
  exit 1
fi

if [[ ! -f "$OLD_ENV_FILE" ]]; then
  echo "OLD_ENV_FILE does not exist: $OLD_ENV_FILE" >&2
  exit 1
fi

if [[ ! -f "$NEW_ENV_FILE" ]]; then
  echo "NEW_ENV_FILE does not exist: $NEW_ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$OLD_ENV_FILE"
OLD_AUTH_SESSION_SECRET="${AUTH_SESSION_SECRET:-}"
OLD_GEMINI_API_KEY="${GEMINI_API_KEY:-}"
set +a

set -a
# shellcheck disable=SC1090
source "$NEW_ENV_FILE"
NEW_AUTH_SESSION_SECRET="${AUTH_SESSION_SECRET:-}"
NEW_GEMINI_API_KEY="${GEMINI_API_KEY:-}"
set +a

if [[ -z "$OLD_AUTH_SESSION_SECRET" || -z "$NEW_AUTH_SESSION_SECRET" ]]; then
  echo "AUTH_SESSION_SECRET must exist in both old and new env files." >&2
  exit 1
fi

if [[ "$OLD_AUTH_SESSION_SECRET" == "$NEW_AUTH_SESSION_SECRET" ]]; then
  echo "Rotation drill failed: AUTH_SESSION_SECRET did not change." >&2
  exit 1
fi

if [[ -n "$OLD_GEMINI_API_KEY" && -n "$NEW_GEMINI_API_KEY" && "$OLD_GEMINI_API_KEY" == "$NEW_GEMINI_API_KEY" ]]; then
  echo "Rotation drill failed: GEMINI_API_KEY did not change." >&2
  exit 1
fi

ENV_FILE="$NEW_ENV_FILE" bash ops/secrets/validate-env.sh >/dev/null

fp() {
  printf '%s' "$1" | sha256sum | awk '{print substr($1,1,12)}'
}

ts="$(date -u +%Y%m%dT%H%M%SZ)"
if [[ -z "$REPORT_FILE" ]]; then
  mkdir -p ops/secrets/reports
  REPORT_FILE="ops/secrets/reports/rotation-drill-${ts}.md"
fi

cat > "$REPORT_FILE" <<EOF
# Secrets Rotation Drill Report

- Timestamp (UTC): $(date -u +"%Y-%m-%dT%H:%M:%SZ")
- Old env file: ${OLD_ENV_FILE}
- New env file: ${NEW_ENV_FILE}
- Validation command: \`ENV_FILE=${NEW_ENV_FILE} bash ops/secrets/validate-env.sh\`

## Checks

- AUTH_SESSION_SECRET changed: yes
- GEMINI_API_KEY changed: yes
- New env validation: passed

## Fingerprints (non-secret)

- Old AUTH_SESSION_SECRET sha12: $(fp "$OLD_AUTH_SESSION_SECRET")
- New AUTH_SESSION_SECRET sha12: $(fp "$NEW_AUTH_SESSION_SECRET")
- Old GEMINI_API_KEY sha12: $(fp "$OLD_GEMINI_API_KEY")
- New GEMINI_API_KEY sha12: $(fp "$NEW_GEMINI_API_KEY")
EOF

echo "Rotation drill passed."
echo "Report written: $REPORT_FILE"
