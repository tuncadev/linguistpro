# LinguistPro Production Deployment Plan and ToDo

Last updated: 2026-04-26
Status owner: Codex session tracker

This is the canonical execution tracker for production readiness in this repo.
Future Codex instances should read this file first, execute the `Next Step`, then update checklist states.

## Current Next Step

1. Build enrollments API with idempotency checks.

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
- [ ] Build enrollments API with idempotency checks.
- [ ] Build admin moderation flow for course approval.
- [ ] Replace mock data paths with DB-backed services.
- [ ] Add centralized error handling and API validation.
- [ ] Add test suite (unit + integration + E2E critical flows).
- [ ] Add CI/CD with required checks before merge/deploy.
- [ ] Add observability (logs, traces, metrics, error tracking).
- [ ] Add backup policy and restore test for Postgres.
- [ ] Add production env/secrets policy and rotation runbook.
- [ ] Complete staging UAT and sign-off.
- [ ] Document deploy and rollback runbooks.
- [ ] Execute production launch checklist.

## P1 First-Month Enhancements

- [ ] Add billing/payments.
- [ ] Add email workflows (verification, enrollment, reminders).
- [ ] Add moderation/abuse reporting.
- [ ] Add caching and query optimization.
- [ ] Add feature flags.
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
