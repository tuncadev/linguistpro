#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-}"

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "ENV_FILE does not exist: $ENV_FILE" >&2
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

required_vars=(
  NODE_ENV
  AUTH_SESSION_SECRET
  DATABASE_URL
  GEMINI_API_KEY
  ZOOM_CLIENT_ID
  ZOOM_CLIENT_SECRET
  ZOOM_REDIRECT_URI
  ZOOM_WEBHOOK_SECRET
  INTEGRATION_ENCRYPTION_KEY
  AUTH_ALLOW_DEV_ROLE_HEADER
)

missing_vars=()
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    missing_vars+=("$var_name")
  fi
done

if [[ ${#missing_vars[@]} -gt 0 ]]; then
  echo "Missing required environment variables:" >&2
  printf ' - %s\n' "${missing_vars[@]}" >&2
  exit 1
fi

if [[ "$NODE_ENV" != "production" ]]; then
  echo "NODE_ENV must be 'production' for deployment validation." >&2
  exit 1
fi

if [[ "${#AUTH_SESSION_SECRET}" -lt 32 ]]; then
  echo "AUTH_SESSION_SECRET must be at least 32 characters." >&2
  exit 1
fi

if [[ "$AUTH_SESSION_SECRET" == *"change-me"* ]]; then
  echo "AUTH_SESSION_SECRET cannot contain placeholder text." >&2
  exit 1
fi

if [[ "${AUTH_ALLOW_DEV_ROLE_HEADER}" == "true" ]]; then
  echo "AUTH_ALLOW_DEV_ROLE_HEADER must be false in production." >&2
  exit 1
fi

if [[ "$DATABASE_URL" != postgresql://* ]]; then
  echo "DATABASE_URL must use a postgresql:// URL." >&2
  exit 1
fi

if [[ "$GEMINI_API_KEY" == *"PLACEHOLDER"* ]] || [[ "$GEMINI_API_KEY" == *"change-me"* ]]; then
  echo "GEMINI_API_KEY cannot contain placeholder text in production validation." >&2
  exit 1
fi

if [[ "${#ZOOM_CLIENT_ID}" -lt 5 ]] || [[ "$ZOOM_CLIENT_ID" == *"change-me"* ]]; then
  echo "ZOOM_CLIENT_ID appears invalid for production validation." >&2
  exit 1
fi

if [[ "${#ZOOM_CLIENT_SECRET}" -lt 12 ]] || [[ "$ZOOM_CLIENT_SECRET" == *"change-me"* ]]; then
  echo "ZOOM_CLIENT_SECRET appears invalid for production validation." >&2
  exit 1
fi

if [[ "$ZOOM_REDIRECT_URI" != https://* ]]; then
  echo "ZOOM_REDIRECT_URI must be an https:// URL for production validation." >&2
  exit 1
fi

if [[ "${#ZOOM_WEBHOOK_SECRET}" -lt 12 ]] || [[ "$ZOOM_WEBHOOK_SECRET" == *"change-me"* ]]; then
  echo "ZOOM_WEBHOOK_SECRET appears invalid for production validation." >&2
  exit 1
fi

if ! printf '%s' "$INTEGRATION_ENCRYPTION_KEY" | base64 -d >/dev/null 2>&1; then
  echo "INTEGRATION_ENCRYPTION_KEY must be valid base64." >&2
  exit 1
fi

decoded_key_len="$(printf '%s' "$INTEGRATION_ENCRYPTION_KEY" | base64 -d | wc -c | tr -d ' ')"
if [[ "$decoded_key_len" -ne 32 ]]; then
  echo "INTEGRATION_ENCRYPTION_KEY must decode to exactly 32 bytes." >&2
  exit 1
fi

echo "Production environment validation passed."
