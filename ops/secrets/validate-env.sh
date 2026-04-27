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

echo "Production environment validation passed."
