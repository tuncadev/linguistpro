---
name: "linguistpro-maintainer"
description: "Onboard quickly to the LinguistPro project, make safe architectural edits, and keep Codex handoff docs in sync."
---

# LinguistPro Maintainer Workflow

Use this skill when working inside `/home/pardus/Hosting/linguistpro`.

## Goal

Provide a repeatable workflow so future Codex sessions can:
- understand the current implementation quickly
- edit safely without breaking context-driven navigation
- keep project documentation synchronized

## Step 1: Load project context

Read in this order:
1. `AGENTS.md`
2. `README.md`
3. `docs/CODEX_CONTEXT.md`
4. `docs/DEPLOYMENT_PLAN_TODO.md`
5. `docs/INFRA_DECISION.md`
6. `docs/NEXTJS_ROUTE_MAP.md`
7. `prisma/schema.prisma`
8. `lib/auth/session.ts`
9. `lib/auth/server-checks.ts`
10. `lib/ai/course-draft.ts`
11. `app/api/courses/route.ts`
12. `app/api/enroll/route.ts`
13. `app/api/admin/courses/[id]/moderate/route.ts`
14. `services/courseApiService.ts`
15. `lib/http/with-api-handler.ts`
16. `lib/observability/metrics.ts`
17. `lib/observability/error-tracker.ts`
18. `ops/backup/postgres-backup.sh`
19. `ops/backup/postgres-restore-test.sh`
20. `docs/POSTGRES_BACKUP_RUNBOOK.md`
21. `ops/secrets/validate-env.sh`
22. `docs/SECRETS_POLICY_RUNBOOK.md`
23. `ops/uat/smoke-check.sh`
24. `docs/STAGING_UAT_SIGNOFF.md`
25. `ops/deploy/preflight.sh`
26. `docs/DEPLOY_ROLLBACK_RUNBOOK.md`
27. `.github/workflows/ci.yml`
28. `App.tsx`
29. `types.ts`
30. `constants.ts`

## Step 2: Confirm baseline

Run:
- `npm run build`
- `npm run test`

If build fails, fix or report blockers before making broader changes.

## Step 3: Apply changes with architecture awareness

Respect these constraints:
- Navigation is controlled by `view` state in `App.tsx`.
- Cross-view selections (`selectedLang`, `selectedCourse`, `selectedTutor`, `activeLesson`) must be set before target view transitions.
- `Course` interface fields are required by multiple views; keep generated and mocked data compatible.

## Step 4: Update persistence docs after code changes

Always update docs when behavior or architecture changes:
- `README.md` for contributor-facing changes
- `docs/CODEX_CONTEXT.md` for detailed technical updates
- `docs/DEPLOYMENT_PLAN_TODO.md` for release-progress tracking
- `AGENTS.md` for stable agent-specific conventions

## Step 5: Verify and summarize

Run:
- `npm run build`
- `npm run test`

Then summarize:
- what changed
- why it changed
- what was verified
- any remaining risks

## References

Use `references/checklist.md` for a compact operational checklist.
