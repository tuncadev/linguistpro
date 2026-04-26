#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${STAGING_BASE_URL:-${1:-http://127.0.0.1:3001}}"
REPORT_DIR="${REPORT_DIR:-ops/uat/reports}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_FILE="${REPORT_DIR}/uat-role-flow-${TIMESTAMP}.md"
MODERATION_DECISION="${UAT_MODERATION_DECISION:-REJECT}"

mkdir -p "$REPORT_DIR"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

pass_count=0
fail_count=0
report_rows=()

RESPONSE_STATUS=""
RESPONSE_BODY_FILE=""
RESPONSE_HEADERS_FILE=""

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local cookie_in="${4:-}"
  local cookie_out="${5:-}"

  local body_file="${TMP_DIR}/body.json"
  local headers_file="${TMP_DIR}/headers.txt"
  local url="${BASE_URL%/}${path}"
  local http_code

  local cmd=(curl -sS -X "$method" -D "$headers_file" -o "$body_file" -w "%{http_code}" "$url")
  if [[ -n "$cookie_in" ]]; then
    cmd+=(-b "$cookie_in")
  fi
  if [[ -n "$cookie_out" ]]; then
    cmd+=(-c "$cookie_out")
  fi
  if [[ -n "$body" ]]; then
    cmd+=(-H "content-type: application/json" --data "$body")
  fi

  http_code="$("${cmd[@]}" || true)"
  RESPONSE_STATUS="$http_code"
  RESPONSE_BODY_FILE="$body_file"
  RESPONSE_HEADERS_FILE="$headers_file"
}

json_field() {
  local file="$1"
  local expr="$2"

  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const expr = process.argv[2];
    const raw = fs.readFileSync(file, "utf8").trim();
    const data = raw ? JSON.parse(raw) : {};
    let value = "";
    try {
      value = new Function("obj", `return obj.${expr}`)(data);
    } catch {
      value = "";
    }
    if (value === undefined || value === null) {
      process.stdout.write("");
    } else if (typeof value === "object") {
      process.stdout.write(JSON.stringify(value));
    } else {
      process.stdout.write(String(value));
    }
  ' "$file" "$expr"
}

header_value() {
  local file="$1"
  local header_name="$2"
  awk -F': ' -v key="$(printf '%s' "$header_name" | tr '[:upper:]' '[:lower:]')" '
    tolower($1) == key {
      gsub("\r", "", $2);
      print $2;
      exit
    }
  ' "$file"
}

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

expect_status() {
  local step="$1"
  local expected_csv="$2"
  local detail_prefix="$3"

  IFS=',' read -r -a expected_codes <<< "$expected_csv"
  local matched=0
  for code in "${expected_codes[@]}"; do
    if [[ "$RESPONSE_STATUS" == "$code" ]]; then
      matched=1
      break
    fi
  done

  if [[ "$matched" -eq 1 ]]; then
    record_pass "$step" "${detail_prefix} (status ${RESPONSE_STATUS})"
    return 0
  fi

  local body_preview
  body_preview="$(tr '\n' ' ' < "$RESPONSE_BODY_FILE" | head -c 180)"
  record_fail "$step" "${detail_prefix} (expected ${expected_csv}, got ${RESPONSE_STATUS}; body: ${body_preview})"
  return 1
}

student_cookie="${TMP_DIR}/student.cookie"
tutor_cookie="${TMP_DIR}/tutor.cookie"
admin_cookie="${TMP_DIR}/admin.cookie"

course_id=""
language_id=""
level_id=""
draft_id=""

request "GET" "/api/courses"
if expect_status "Bootstrap courses lookup" "200" "Fetch published course list"; then
  course_id="$(json_field "$RESPONSE_BODY_FILE" "data[0]?.id")"
  language_id="$(json_field "$RESPONSE_BODY_FILE" "data[0]?.languageId")"
  level_id="$(json_field "$RESPONSE_BODY_FILE" "data[0]?.levelId")"
  if [[ -n "$course_id" && -n "$language_id" && -n "$level_id" ]]; then
    record_pass "Bootstrap IDs" "course=${course_id}, language=${language_id}, level=${level_id}"
  else
    record_fail "Bootstrap IDs" "Missing course/language/level IDs in /api/courses response"
  fi
fi

request "GET" "/api/admin/courses/submissions"
if expect_status "Unauthorized admin check" "401" "Verify protected endpoint rejects guest"; then
  request_id_header="$(header_value "$RESPONSE_HEADERS_FILE" "x-request-id")"
  if [[ -n "$request_id_header" ]]; then
    record_pass "API requestId header" "x-request-id returned for 401 response"
  else
    record_fail "API requestId header" "Missing x-request-id header on 401 response"
  fi
fi

request "POST" "/api/auth/login" '{"email":"student@linguistpro.local","password":"Student123!"}' "" "$student_cookie"
expect_status "Student login" "200" "Authenticate STUDENT account" || true

if [[ -n "$course_id" ]]; then
  request "POST" "/api/enroll" "{\"courseId\":\"${course_id}\"}" "$student_cookie"
  expect_status "Student enroll" "200,201" "Enroll student into a published course (idempotent allowed)" || true

  request "GET" "/api/enroll" "" "$student_cookie"
  if expect_status "Student enrollment list" "200" "Load student enrollments"; then
    enrolled_id="$(json_field "$RESPONSE_BODY_FILE" "data[0]?.courseId")"
    if grep -q "\"courseId\":\"${course_id}\"" "$RESPONSE_BODY_FILE"; then
      record_pass "Enrollment verification" "Enrollment payload includes course ${course_id}"
    else
      record_fail "Enrollment verification" "Enrollment payload missing course ${course_id} (first courseId=${enrolled_id})"
    fi
  fi
fi

request "POST" "/api/auth/login" '{"email":"tutor@linguistpro.local","password":"Tutor123!"}' "" "$tutor_cookie"
expect_status "Tutor login" "200" "Authenticate TUTOR account" || true

if [[ -n "$language_id" && -n "$level_id" ]]; then
  unique_title="UAT Draft ${TIMESTAMP}"
  draft_payload="$(cat <<JSON
{"title":"${unique_title}","description":"Automated UAT draft creation for moderation flow verification.","price":49.99,"languageId":"${language_id}","levelId":"${level_id}","syllabus":["Intro","Practice"]}
JSON
)"
  request "POST" "/api/courses" "$draft_payload" "$tutor_cookie"
  if expect_status "Tutor create draft" "201" "Create draft course via /api/courses"; then
    draft_id="$(json_field "$RESPONSE_BODY_FILE" "data?.id")"
    if [[ -n "$draft_id" ]]; then
      record_pass "Draft ID capture" "Created draft ${draft_id}"
    else
      record_fail "Draft ID capture" "Draft response missing data.id"
    fi
  fi
fi

if [[ -n "$draft_id" ]]; then
  request "POST" "/api/courses/${draft_id}/submit" "" "$tutor_cookie"
  if expect_status "Tutor submit draft" "200" "Submit draft for admin moderation"; then
    submitted_status="$(json_field "$RESPONSE_BODY_FILE" "data?.status")"
    if [[ "$submitted_status" == "PENDING_REVIEW" ]]; then
      record_pass "Submit status" "Course status is PENDING_REVIEW"
    else
      record_fail "Submit status" "Expected PENDING_REVIEW, got '${submitted_status}'"
    fi
  fi
fi

request "POST" "/api/auth/login" '{"email":"admin@linguistpro.local","password":"Admin123!"}' "" "$admin_cookie"
expect_status "Admin login" "200" "Authenticate ADMIN account" || true

if [[ -n "$draft_id" ]]; then
  request "GET" "/api/admin/courses/submissions" "" "$admin_cookie"
  if expect_status "Admin list submissions" "200" "Load pending review queue"; then
    if grep -q "\"id\":\"${draft_id}\"" "$RESPONSE_BODY_FILE"; then
      record_pass "Submission visibility" "Draft ${draft_id} appears in pending queue"
    else
      record_fail "Submission visibility" "Draft ${draft_id} missing from pending queue"
    fi
  fi

  if [[ "$MODERATION_DECISION" != "APPROVE" && "$MODERATION_DECISION" != "REJECT" ]]; then
    MODERATION_DECISION="REJECT"
  fi
  moderate_payload="{\"decision\":\"${MODERATION_DECISION}\",\"reason\":\"Automated role-flow UAT ${TIMESTAMP}\"}"
  request "POST" "/api/admin/courses/${draft_id}/moderate" "$moderate_payload" "$admin_cookie"
  if expect_status "Admin moderate draft" "200" "Moderate pending course (${MODERATION_DECISION})"; then
    final_status="$(json_field "$RESPONSE_BODY_FILE" "data?.status")"
    expected_status="DRAFT"
    if [[ "$MODERATION_DECISION" == "APPROVE" ]]; then
      expected_status="PUBLISHED"
    fi
    if [[ "$final_status" == "$expected_status" ]]; then
      record_pass "Moderation status" "Course moved to ${final_status}"
    else
      record_fail "Moderation status" "Expected ${expected_status}, got '${final_status}'"
    fi
  fi
fi

{
  echo "# UAT Role Flow Report"
  echo
  echo "- Timestamp (UTC): ${TIMESTAMP}"
  echo "- Base URL: ${BASE_URL}"
  echo "- Moderation decision: ${MODERATION_DECISION}"
  echo "- Pass: ${pass_count}"
  echo "- Fail: ${fail_count}"
  echo
  echo "| Step | Result | Detail |"
  echo "|---|---|---|"
  for row in "${report_rows[@]}"; do
    echo "$row"
  done
} > "$REPORT_FILE"

echo "Role-flow report written to: $REPORT_FILE"
echo "Pass: $pass_count, Fail: $fail_count"

if [[ "$fail_count" -gt 0 ]]; then
  exit 1
fi

