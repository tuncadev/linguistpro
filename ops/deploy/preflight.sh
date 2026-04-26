#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${ENV_FILE:-}" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "[preflight] ENV_FILE does not exist: $ENV_FILE" >&2
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "[preflight] DATABASE_URL is required. Set DATABASE_URL or provide ENV_FILE." >&2
  exit 1
fi

echo "[preflight] Running Prisma schema validation..."
npm run prisma:validate

echo "[preflight] Running automated tests..."
npm run test

echo "[preflight] Running production build..."
npm run build

if [[ -n "${ENV_FILE:-}" || "${NODE_ENV:-}" == "production" ]]; then
  echo "[preflight] Validating production environment policy ..."
  ENV_FILE="${ENV_FILE:-}" npm run ops:validate-env
else
  echo "[preflight] Skipping env policy validation (set ENV_FILE to enable)."
fi

echo "[preflight] Completed successfully."
