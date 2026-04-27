# LinguistPro Maintainer Checklist

## Mandatory Task Control (Trello + Clockify)

- Move card to `in progress` before coding
- Start Clockify timer on matching task before coding
- Set Clockify `What are you working on` to exact Trello card name
- Run QA before status update
- Stop Clockify timer before moving card out of implementation
- Move card to `qa ready` if unblocked and complete
- Move card to `blocked` if any blocker remains
- Never report task completion while any related timer is still active

## Quick Audit

- Read `AGENTS.md`
- Read `README.md`
- Read `docs/CODEX_CONTEXT.md`
- Read `docs/DEPLOYMENT_PLAN_TODO.md`
- Read `docs/INFRA_DECISION.md`
- Read `docs/NEXTJS_ROUTE_MAP.md`
- Read `prisma/schema.prisma`
- Read `lib/auth/session.ts`
- Read `lib/auth/server-checks.ts`
- Read `lib/ai/course-draft.ts`
- Read `app/api/courses/route.ts`
- Read `app/api/enroll/route.ts`
- Read `app/api/admin/courses/[id]/moderate/route.ts`
- Read `services/courseApiService.ts`
- Read `lib/http/with-api-handler.ts`
- Read `lib/observability/metrics.ts`
- Read `lib/observability/error-tracker.ts`
- Read `ops/backup/postgres-backup.sh`
- Read `ops/backup/postgres-restore-test.sh`
- Read `docs/POSTGRES_BACKUP_RUNBOOK.md`
- Read `ops/secrets/validate-env.sh`
- Read `docs/SECRETS_POLICY_RUNBOOK.md`
- Read `ops/uat/smoke-check.sh`
- Read `docs/STAGING_UAT_SIGNOFF.md`
- Read `ops/deploy/preflight.sh`
- Read `docs/DEPLOY_ROLLBACK_RUNBOOK.md`
- Read `.github/workflows/ci.yml`
- Inspect `App.tsx`, `types.ts`, `constants.ts`

## Build Verification

- Run `npm run build` before edits if possible
- Run `npm run test` before edits if possible
- Run `npm run build` after edits
- Run `npm run test` after edits

## High-Risk Touchpoints

- `App.tsx` context shape changes
- `view` transition logic changes
- `Course` field compatibility across views
- `services/geminiService.ts` response parsing contract

## Must-Update Docs When Behavior Changes

- `README.md`
- `docs/CODEX_CONTEXT.md`
- `docs/DEPLOYMENT_PLAN_TODO.md`
- `AGENTS.md`

## Planned vs Implemented Reminder

- Implemented: Next.js runtime + API/auth/RBAC/Prisma scaffold + Vitest test layers + deployment runbooks
- Planned only: production launch execution and remaining UAT/sign-off closure
