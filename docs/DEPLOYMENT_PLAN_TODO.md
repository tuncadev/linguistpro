# LinguistPro Production Deployment Plan and ToDo

Last updated: 2026-04-28
Status owner: Codex session tracker

This is the canonical execution tracker for production readiness in this repo.
Future Codex instances should read this file first, execute the `Next Step`, then update checklist states.

## Current Next Step

1. Execute production readiness card: Billing Provider Integration (Stripe or Equivalent).

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
- 2026-04-27: Wired taxonomy+tutor hardcoded frontend paths to backend (`/api/taxonomies`, `/api/tutors`) via new services and AppContext state; updated Home/Catalog/LanguageLanding/TutorDashboard/CourseDetails to consume backend-first data with fallback.
- 2026-04-27: Wired navbar role-switch users and admin dashboard hardcoded blocks to backend (`/api/demo-users`, `/api/admin/dashboard/overview`), updated auth payload/profile mapping, and made `StudentDashboard` upcoming class card backend-context driven.
- 2026-04-27: Implemented functional Next.js admin course management page (`/admin/courses`) with create/update/delete/list using backend APIs, dynamic taxonomy+tutor selectors, and retained static summary cards.
- 2026-04-27: Made course details page content backend-driven (objectives/enrollment labels/lists), added course presentation fields in DB/API/seed, synced legacy hardcoded catalog courses into published backend data, and fixed admin-created course visibility by supporting published creation + frontend fallback logic correction.
- 2026-04-27: Added admin-only in-place course edit mode directly on legacy `CourseDetailsView` (same UI structure with input substitution), persisted to backend including structured curriculum (`syllabusSections`), and added admin sidebar shortcut to catalog courses page.
- 2026-04-27: Added admin tutor management flow with DB-backed add/edit/remove (`/admin/tutors`, `/api/admin/tutors`, `/api/admin/tutors/:id`) and linked admin navigation tabs across courses/tutors/users.
- 2026-04-27: Added persistent left admin navigation layout, dedicated tutor edit route (`/admin/tutors/:id`), enforced tutor-role-only course assignment in `/api/courses*`, and normalized course label wording to `Course Tutor`.
- 2026-04-27: Added tutor integrity fallback (`/api/tutors` + `/api/admin/tutors`) to auto-create a default frontend-style tutor when tutor records are empty and exposed admin edit action directly on legacy tutor profile view.
- 2026-04-27: Refined legacy tutor profile to support in-place admin editing on the same UI layout (parallel to course details edit flow), instead of forcing a separate admin edit screen.
- 2026-04-27: Added backend tutor profile modules (location/languages, profile highlights list, stats modules, pedagogical modules) with Prisma migration and tutor API support; wired same-layout in-page editing on `TutorProfileView`.
- 2026-04-27: Finalized production infrastructure topology with committed environment diagram and provisioning/IaC baseline docs (`docs/PRODUCTION_INFRA_TOPOLOGY.md`, `ops/infra/PROVISIONING_RUNBOOK.md`, `ops/infra/terraform/README.md`).
- 2026-04-27: Hardened env/secrets workflow with tracked-repo secret scanning (`ops/secrets/check-repo-secrets.sh`), rotation drill evidence generation (`ops/secrets/rotation-drill.sh`), stricter production env checks (`ops/secrets/validate-env.sh`), updated runbook, and drill report `ops/secrets/reports/rotation-drill-20260427T153109Z.md`.
- 2026-04-27: Auth security hardening implemented with DB-backed verification/reset tokens (`AuthToken`), new auth endpoints (`/api/auth/request-verification`, `/api/auth/verify-email`, `/api/auth/forgot-password`, `/api/auth/reset-password`), login lockout + in-memory IP rate limits, and frontend registration verification handling.
- 2026-04-27: Student onboarding flow implemented via `/api/student/onboarding` + `/api/student/welcome` and fully wired `/student/my-learning` page for profile completion, first-course enrollment, and next-lesson continuation.
- 2026-04-27: Tutor governance implemented via `TutorApprovalStatus`, `/api/tutor/onboarding`, `/api/admin/tutors/:id/approve`, admin tutor approval fields, and publish-path guardrails requiring approved tutors before draft/create/submit/publish transitions.
- 2026-04-28: Completed RBAC and Permission Audit card with formal policy doc (`docs/RBAC_PERMISSION_MATRIX.md`) and automated permission regression tests (`tests/unit/rbac-permissions.unit.test.ts`) covering app route prefixes and protected API role guards.
- 2026-04-28: Completed Course Lifecycle Completion card by enforcing explicit status-transition rules (`lib/courses/lifecycle.ts`), adding lifecycle audit persistence (`CourseLifecycleEvent` + migration `20260428130500_course_lifecycle_audit`), and wiring transition logging into create/submit/moderate/patch course flows.
- 2026-04-28: Completed Enrollment and Access Consistency card by adding backend learning-access validation (`/api/learning/access`, `lib/learning/access.ts`), protecting lesson route rendering with session + access checks (`app/learn/[courseId]/[lessonId]/page.tsx`), and adding policy tests (`tests/unit/learning-access.unit.test.ts`).
