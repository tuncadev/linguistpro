# Staging UAT Sign-Off

Last updated: 2026-04-26

Use this document to execute and record staging acceptance checks before production launch.

## Preconditions

- Staging deployment is up and reachable.
- Production-like environment variables are set.
- Latest migrations are applied.
- Test accounts exist for `ADMIN`, `TUTOR`, `STUDENT`.

## Automated Smoke Check

Run against staging URL:

```bash
STAGING_BASE_URL=https://staging.example.com npm run ops:uat:smoke
STAGING_BASE_URL=https://staging.example.com npm run ops:uat:roles
STAGING_BASE_URL=https://staging.example.com QA_OWNER="QA Lead" PRODUCT_OWNER="PO Name" NOTES="Release candidate RC1" npm run ops:uat:signoff
```

Artifacts:
- UAT report outputs are written to `ops/uat/reports/`.
- Sign-off summary output is written to `ops/uat/reports/staging-signoff-*.md` (includes a ready-to-paste sign-off log row).

## Manual UAT Checklist

- [ ] Public pages load (`/`, `/about`, `/courses`) with expected UI.
- [ ] Student flow: login/session + enroll happy-path.
- [ ] Tutor flow: create draft + submit for moderation.
- [ ] Admin flow: review pending submissions + approve/reject.
- [ ] API errors include `requestId` for traceability.
- [ ] CI checks passed on the release branch.
- [ ] No blocker defects open for launch scope.

## Sign-Off Log

| Date (UTC) | Environment URL | Smoke Report | QA Owner | Product Owner | Result | Notes |
|---|---|---|---|---|---|---|
| 2026-04-26 | _deferred_ | _n/a_ | Codex | _pending_ | WAIVED (temporary) | Staging QA skipped by owner decision for now; production flow proceeded with explicit waiver override. |
| 2026-04-26 | `http://127.0.0.1:3001` (local orchestrator run) | `ops/uat/reports/staging-signoff-20260426T165842Z.md` | Codex | _pending_ | PASS (local) | `ops:uat:signoff` validated; formal staging sign-off still pending. |
| 2026-04-26 | `http://127.0.0.1:3001` (local dry-run) | `ops/uat/reports/uat-role-flow-20260426T161816Z.md` | Codex | _pending_ | PASS (local) | Full student/tutor/admin API role-flow check passed; formal staging sign-off still pending. |
| 2026-04-26 | `http://127.0.0.1:3001` (local dry-run) | `ops/uat/reports/uat-smoke-20260426T161816Z.md` | Codex | _pending_ | PASS (local) | Local Next runtime smoke succeeded; formal staging sign-off still pending. |
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
