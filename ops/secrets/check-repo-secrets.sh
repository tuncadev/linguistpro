#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT_DIR"

# Block committing env/secret artifact files other than templates.
disallowed_files="$(
  git ls-files | rg -n '(^|/)\.env($|\.(production|prod|staging|stage|local)$)|(^|/).+\.(pem|key|p12)$' || true
)"

if [[ -n "$disallowed_files" ]]; then
  echo "Tracked secret-like files detected. Remove from git tracking:" >&2
  printf '%s\n' "$disallowed_files" >&2
  exit 1
fi

# Detect direct secret assignments in tracked files. Allow placeholder values only.
matches="$(
  git grep -nE '^(AUTH_SESSION_SECRET|DATABASE_URL|GEMINI_API_KEY|STRIPE_SECRET_KEY|ZOOM_CLIENT_SECRET|TRELLO_TOKEN|CLOCKIFY_API)=.+' -- . ':!.env.example' ':!ops/secrets/reports/*' || true
)"

if [[ -z "$matches" ]]; then
  echo "Repository secret scan passed."
  exit 0
fi

violations=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  value="${line#*=}"
  lower_value="$(printf '%s' "$value" | tr '[:upper:]' '[:lower:]')"

  if [[ "$lower_value" == *"placeholder"* ]] || [[ "$lower_value" == *"change-me"* ]] || [[ "$lower_value" == *"example"* ]] || [[ "$lower_value" == *"your_"* ]] || [[ "$value" == *"\${"* ]]; then
    continue
  fi

  violations+=("$line")
done <<< "$matches"

if [[ "${#violations[@]}" -gt 0 ]]; then
  echo "Potential committed secrets detected in tracked files:" >&2
  printf ' - %s\n' "${violations[@]}" >&2
  exit 1
fi

echo "Repository secret scan passed."
