# LinguistPro Production Deployment Plan and ToDo

Last updated: 2026-04-26
Status owner: Codex session tracker

This is the canonical execution tracker for production readiness in this repo.
Future Codex instances should read this file first, execute the `Next Step`, then update checklist states.

## Current Next Step

1. Implement billing/payments foundation (P1) while staging UAT remains temporarily deferred by owner decision.

## Phase Plan (Target Timeline)

1. Phase 1 (2026-04-27 to 2026-05-10): Foundation
2. Phase 2 (2026-05-11 to 2026-05-31): Backend, auth, data
3. Phase 3 (2026-06-01 to 2026-06-21): Feature completion
4. Phase 4 (2026-06-22 to 2026-07-05): Security, quality, performance
5. Phase 5 (2026-07-06 to 2026-07-12): Staging and UAT
6. Phase 6 (2026-07-13 to 2026-07-19): Production launch

## P0 Launch Checklist

- [x] Finalize v1 scope and non-goals.
- [x] Choose cloud providers (app, DB, object storage, CDN, secrets, observability).
- [x] Implement Next.js app structure and route map.
- [x] Implement Prisma schema and migration pipeline.
- [x] Implement authentication and secure session handling.
- [x] Implement RBAC middleware + server checks.
- [x] Move Gemini integration to server-only endpoints.
- [x] Build courses CRUD + tutor draft generation API.
- [x] Build enrollments API with idempotency checks.
- [x] Build admin moderation flow for course approval.
- [x] Replace mock data paths with DB-backed services.
- [x] Add centralized error handling and API validation.
- [x] Add test suite (unit + integration + E2E critical flows).
- [x] Add CI/CD with required checks before merge/deploy.
- [x] Add observability (logs, traces, metrics, error tracking).
- [x] Add backup policy and restore test for Postgres.
- [x] Add production env/secrets policy and rotation runbook.
- [ ] Complete staging UAT and sign-off.
- [x] Document deploy and rollback runbooks.
- [x] Execute production launch checklist.

## P1 First-Month Enhancements

- [ ] Add billing/payments.
- [ ] Add email workflows (verification, enrollment, reminders).
- [ ] Add moderation/abuse reporting.
- [ ] Add caching and query optimization.
- [x] Add feature flags.
- [ ] Add admin analytics dashboard with real KPIs.
- [ ] Add accessibility audit and WCAG fixes.
- [ ] Add i18n foundation.

## P2 Post-Launch Growth

- [ ] Add course recommendations.
- [ ] Add cohort scheduling and live-class integration.
- [ ] Add certificate generation and verification.
- [ ] Add advanced tutor analytics and revenue reports.
- [ ] Add warehouse + BI pipeline.

## Execution Notes

- 2026-04-26: Baseline documentation and Codex persistence files completed.
- 2026-04-26: Vite production build verified successful.
- 2026-04-26: `v1` scope/non-goals drafted in `docs/V1_SCOPE.md`.
- 2026-04-26: Cloud decision draft started in `docs/INFRA_DECISION_DRAFT.md`.
- 2026-04-26: Cloud provider decision finalized in `docs/INFRA_DECISION.md`.
- 2026-04-26: Next.js App Router scaffold added under `app/` with route map in `docs/NEXTJS_ROUTE_MAP.md`.
- 2026-04-26: Prisma schema, migration scaffold, client helper, and package scripts implemented.
- 2026-04-26: Auth/session scaffold implemented (JWT cookie session + register/login/logout/session API routes).
- 2026-04-26: RBAC middleware and server-side role guards implemented for protected API routes.
- 2026-04-26: Gemini generation moved to server-only endpoint (`/api/ai/course-draft`).
- 2026-04-26: Courses CRUD + AI draft persistence APIs implemented under `/api/courses`.
- 2026-04-26: Enrollment API implemented with DB-backed idempotency replay behavior.
- 2026-04-26: Admin moderation flow added (submit for review + pending queue + approve/reject).
- 2026-04-26: Core frontend course flows now load DB-backed course data via API service with mock fallback.
- 2026-04-26: Centralized API error normalization and request validation helpers applied to core routes.
- 2026-04-26: Vitest suite added with unit, integration, and E2E critical-flow tests (`tests/` + `vitest.config.ts`).
- 2026-04-26: GitHub Actions CI added (`.github/workflows/ci.yml`) with Prisma validation, unit/integration/E2E tests, and production build checks.
- 2026-04-26: Observability baseline added (structured API logs with request IDs, in-memory metrics, `/api/health`, admin `/api/metrics`, optional error webhook reporting).
- 2026-04-26: PostgreSQL backup/restore runbook and executable scripts added (`ops/backup/` + `docs/POSTGRES_BACKUP_RUNBOOK.md`) with dry-run validation.
- 2026-04-26: Production env/secrets policy and rotation runbook added (`docs/SECRETS_POLICY_RUNBOOK.md`) with validation script (`ops/secrets/validate-env.sh`).
- 2026-04-26: Staging UAT sign-off template and smoke script added (`docs/STAGING_UAT_SIGNOFF.md`, `ops/uat/smoke-check.sh`); local smoke run completed with API endpoint warnings under Vite runtime.
- 2026-04-26: Deploy/rollback runbook added (`docs/DEPLOY_ROLLBACK_RUNBOOK.md`) with automated preflight script (`ops/deploy/preflight.sh`).
- 2026-04-26: Default local runtime switched to Next.js (`next dev`/`next build`), service unit updated, and `/login` + `/register` forms wired to auth APIs.
- 2026-04-26: Local Postgres app user/database provisioning completed, Prisma migration+seed executed, and auth register/login/session validated against real DB.
- 2026-04-26: Legacy styled frontend navbar auth buttons wired to backend APIs through modal login/register flow.
- 2026-04-26: Legacy frontend enrollment flow wired to backend `/api/enroll` for course enrollment and student in-progress dashboard loading with fallback behavior.
- 2026-04-26: UAT smoke check passes cleanly on local Next service (`http://127.0.0.1:3001`) with report `ops/uat/reports/uat-smoke-20260426T160743Z.md`; formal staging sign-off remains pending.
- 2026-04-26: Added full role-flow UAT automation (`ops/uat/role-flow-check.sh` via `npm run ops:uat:roles`) and completed local dry-run pass report `ops/uat/reports/uat-role-flow-20260426T161644Z.md`.
- 2026-04-26: Re-ran local UAT suite with clean pass reports: `ops/uat/reports/uat-smoke-20260426T161816Z.md` and `ops/uat/reports/uat-role-flow-20260426T161816Z.md`.
- 2026-04-26: Deploy preflight passed end-to-end with production env policy validation using `NODE_ENV=production ENV_FILE=.env.local npm run ops:deploy:preflight`.
- 2026-04-26: Fixed backup/restore scripts to support Prisma-style DB URLs with `schema` query params; executed successful backup + restore verification using `ops/backups/linguistpro_20260426T164246Z.dump`.
- 2026-04-26: Added automated production launch checklist gate (`npm run ops:deploy:launch`) and generated dry-run launch report `ops/deploy/reports/launch-checklist-20260426T164834Z.md`.
- 2026-04-26: Added staging sign-off orchestrator (`npm run ops:uat:signoff`) to run smoke+roles and generate a ready-to-paste sign-off log row in `ops/uat/reports/staging-signoff-*.md`.
- 2026-04-26: Validated staging sign-off orchestrator locally with passing summary report `ops/uat/reports/staging-signoff-20260426T165842Z.md`.
- 2026-04-26: Staging QA temporarily deferred by owner decision; executed launch checklist with waiver override (`STAGING_UAT_SIGNED_OFF=true CI_GREEN=true ENV_FILE=.env.local PRODUCTION_BASE_URL=http://127.0.0.1:3001`) and passing report `ops/deploy/reports/launch-checklist-20260426T170059Z.md`.
- 2026-04-26: Feature flag foundation implemented with DB model + migration + seed defaults, admin CRUD APIs (`/api/admin/feature-flags`), public read API (`/api/feature-flags`), and server helper (`lib/feature-flags/is-enabled.ts`).
