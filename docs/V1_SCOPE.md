# LinguistPro v1 Scope and Non-Goals

Last updated: 2026-04-26
Status: Draft finalized for implementation kickoff

## Product Goal

Ship a production-ready language course platform with secure auth, role-based workflows, persistent data, and tutor AI-assisted course drafting.

## In-Scope (v1)

1. Authentication and session management for `STUDENT`, `TUTOR`, `ADMIN`.
2. Public course catalog and course details pages.
3. Tutor workflows:
   - create/edit course draft
   - AI-assisted course draft generation (server-side Gemini call)
   - submit course for review
4. Admin workflows:
   - review/approve/reject tutor course submissions
   - basic user and course management
5. Student workflows:
   - enroll in published courses
   - view enrolled courses
   - consume lesson content/resources
6. Database-backed domain model using Prisma + PostgreSQL.
7. RBAC enforcement in middleware and server handlers.
8. CI/CD pipeline, logs, error tracking, and production/staging environments.

## Non-Goals (v1)

1. Payments and billing automation.
2. Full live-class scheduling system.
3. Advanced recommendation engine.
4. Full analytics/BI stack.
5. Native mobile apps.
6. Multi-tenant white-label support.

## v1 Quality Gates

1. All P0 checklist items in `docs/DEPLOYMENT_PLAN_TODO.md` completed.
2. Staging sign-off completed for all role-critical flows.
3. Backup + restore test verified.
4. Rollback runbook tested before production cutover.
