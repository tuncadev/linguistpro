# LinguistPro Agent Instructions

These instructions are project-local and apply to future Codex sessions in this repository.

## Project Identity

- Project type: frontend prototype
- Runtime: Next.js App Router + React + TypeScript (legacy Vite shell still present)
- Primary goal: demonstrate language-course platform UX and role-based flows
- Current data source: API-first course reads via `services/courseApiService.ts` with `constants.ts` fallback
- AI integration: Gemini draft course generation for tutor dashboard

## First-Read Files

Before making edits, read in this order:
1. `README.md`
2. `docs/CODEX_CONTEXT.md`
3. `docs/DEPLOYMENT_PLAN_TODO.md`
4. `docs/INFRA_DECISION.md`
5. `docs/PRODUCTION_INFRA_TOPOLOGY.md`
6. `ops/infra/PROVISIONING_RUNBOOK.md`
7. `ops/infra/terraform/README.md`
8. `docs/NEXTJS_ROUTE_MAP.md`
9. `prisma/schema.prisma`
10. `lib/auth/session.ts`
11. `lib/auth/server-checks.ts`
12. `lib/ai/course-draft.ts`
13. `app/api/courses/route.ts`
14. `app/api/enroll/route.ts`
15. `app/api/admin/courses/[id]/moderate/route.ts`
16. `app/api/feature-flags/route.ts`
17. `app/api/admin/feature-flags/route.ts`
18. `app/api/admin/feature-flags/[key]/route.ts`
19. `lib/feature-flags/is-enabled.ts`
20. `services/courseApiService.ts`
21. `lib/http/with-api-handler.ts`
22. `lib/observability/metrics.ts`
23. `lib/observability/error-tracker.ts`
24. `ops/backup/postgres-backup.sh`
25. `ops/backup/postgres-restore-test.sh`
26. `docs/POSTGRES_BACKUP_RUNBOOK.md`
27. `ops/secrets/validate-env.sh`
28. `docs/SECRETS_POLICY_RUNBOOK.md`
29. `ops/uat/smoke-check.sh`
30. `ops/uat/role-flow-check.sh`
31. `ops/uat/staging-signoff.sh`
32. `docs/STAGING_UAT_SIGNOFF.md`
33. `ops/deploy/preflight.sh`
34. `ops/deploy/launch-checklist.sh`
35. `docs/DEPLOY_ROLLBACK_RUNBOOK.md`
36. `.github/workflows/ci.yml`
37. `App.tsx`
38. `types.ts`
39. `constants.ts`

## Canonical Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Production build check: `npm run build`
- Local preview: `npm run preview`
- Full tests: `npm run test`
- Unit tests: `npm run test:unit`
- Integration tests: `npm run test:integration`
- E2E critical flows: `npm run test:e2e`
- Prisma seed: `npm run prisma:seed`
- Postgres backup: `npm run db:backup`
- Postgres restore verification: `npm run db:restore:test`
- Production env policy validation: `npm run ops:validate-env`
- UAT smoke check: `npm run ops:uat:smoke`
- UAT role-flow check: `npm run ops:uat:roles`
- UAT staging sign-off orchestrator: `npm run ops:uat:signoff`
- Deploy preflight: `npm run ops:deploy:preflight`
- Deploy preflight (local prod-like env): `NODE_ENV=production ENV_FILE=.env.local npm run ops:deploy:preflight`
- Launch checklist gate: `npm run ops:deploy:launch`

## Architecture Reality Check

- Default runtime is now Next.js App Router (`app/`).
- Files `prisma-schema.txt`, `folder-structure.txt`, and `rbac-strategy.txt` are planning artifacts.
- Legacy Vite navigation is app-state based (`view` string in `App.tsx`), while Next routes live under `app/`.

## Critical State Contracts

`AppContext` keys in `App.tsx` are tightly coupled to many components.
If you change names/shapes, update all consumers in `components/` and `views/`.

Selection flow invariants:
- `setSelectedLang(...)` should precede `view = 'language-landing'`
- `setSelectedCourse(...)` should precede `view = 'course-details'`
- `setActiveLesson(...)` should precede `view = 'lesson-view'`
- `setSelectedTutor(...)` should precede `view = 'tutor-profile'`

## Data Model Contracts

`Course` requires:
- `id`, `title`, `description`, `price`, `imageUrl`
- `tutorId`, `languageId`, `levelId`
- `studentCount`, `rating`, `reviews`
- `syllabus`

When creating courses (example: tutor AI flow), always produce all required fields to avoid runtime/type errors.

## AI Integration Notes

- Gemini wiring lives in `services/geminiService.ts`.
- Client calls `POST /api/ai/course-draft`; Gemini key stays server-side.
- Keep response schema strict JSON for reliable parsing.
- On failure, current behavior returns `null`; preserve or intentionally improve this contract.

## Safe Change Strategy

Frontend preservation rule:
- Keep existing legacy frontend visual style and layout intact while wiring backend incrementally.
- Prefer adapter/wiring changes over broad UI redesign.

When adding new views:
1. Create view component under `views/`.
2. Add `view` case in `App.tsx::renderView()`.
3. Add navigation entry points (Navbar/Sidebar/buttons) as needed.
4. Update docs (`README.md` + `docs/CODEX_CONTEXT.md`) to keep future sessions accurate.

When changing shared types:
1. Update `types.ts`.
2. Update `constants.ts` seed data.
3. Update all views/components using changed fields.
4. Run `npm run build`.

## Persistence Policy for Future Sessions

If architecture or workflows change, persist changes in:
- `README.md` for human contributors
- `docs/CODEX_CONTEXT.md` for detailed technical handoff
- `docs/DEPLOYMENT_PLAN_TODO.md` for execution status and next deploy step
- this `AGENTS.md` for stable project-level agent behavior
- `.agents/skills/linguistpro-maintainer/` for repeatable agent workflow

## Task Execution Workflow (Trello + Clockify)

- Trello board id is stored in `.env.local` keys `TRELLO_BOARD_ID` and `TRELLO_BOARD_IDo`.
- Required Trello lists: `backlog`, `ready`, `in progress`, `blocked`, `qa ready`, `qa passed`, `done`.
- This workflow is mandatory. Do not start implementation work unless the card and timer are in sync.
- Start gate (must pass before coding):
1. Move target Trello card to `in progress`.
2. Start Clockify timer on the matching Clockify task.
3. Set Clockify `What are you working on` to the exact Trello card name.
- End gate (must pass before status report):
1. Run QA checks for the task output.
2. Stop Clockify timer and verify there are no active in-progress entries for this task.
3. Move Trello card:
   - `qa ready` if implementation completed with no blocker.
   - `blocked` if any blocker/issue remains.
4. Report status only after end gate is complete.
- Never mark a task complete or ready while a timer is still running.
