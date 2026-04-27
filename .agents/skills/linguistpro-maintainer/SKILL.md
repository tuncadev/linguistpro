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

## Step 0: Task Control Gate (Mandatory)

For each Trello task, this gate is required:
1. Move Trello card to `in progress`.
2. Start Clockify timer for the matching Clockify task.
3. Set `What are you working on` to the exact Trello card name.
4. Do not start implementation until the timer is confirmed running.

Before reporting final task status:
1. Run QA for the implemented scope.
2. Stop Clockify timer and verify no active in-progress timer remains for the task.
3. Move Trello card to:
   - `qa ready` when implementation is complete and unblocked.
   - `blocked` when any issue blocks completion.
4. Report only after these steps are done.

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
14. `app/api/feature-flags/route.ts`
15. `app/api/admin/feature-flags/route.ts`
16. `app/api/admin/feature-flags/[key]/route.ts`
17. `lib/feature-flags/is-enabled.ts`
18. `services/courseApiService.ts`
19. `lib/http/with-api-handler.ts`
20. `lib/observability/metrics.ts`
21. `lib/observability/error-tracker.ts`
22. `ops/backup/postgres-backup.sh`
23. `ops/backup/postgres-restore-test.sh`
24. `docs/POSTGRES_BACKUP_RUNBOOK.md`
25. `ops/secrets/validate-env.sh`
26. `docs/SECRETS_POLICY_RUNBOOK.md`
27. `ops/uat/smoke-check.sh`
28. `ops/uat/role-flow-check.sh`
29. `ops/uat/staging-signoff.sh`
30. `docs/STAGING_UAT_SIGNOFF.md`
31. `ops/deploy/preflight.sh`
32. `ops/deploy/launch-checklist.sh`
33. `docs/DEPLOY_ROLLBACK_RUNBOOK.md`
34. `.github/workflows/ci.yml`
35. `App.tsx`
36. `types.ts`
37. `constants.ts`

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
