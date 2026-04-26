# Codex Context: LinguistPro

Last verified: 2026-04-26

This file is a technical handoff reference for future Codex sessions.

## 1) What the Repository Is

LinguistPro is currently a Vite-based frontend prototype that simulates:
- public course discovery
- role-specific dashboard UX (`STUDENT`, `TUTOR`, `ADMIN`)
- tutor AI-assisted course draft generation

It is not yet the planned Next.js + Prisma production architecture.

## 2) Actual Runtime Composition

- Entry: `index.tsx`
- App shell + state machine: `App.tsx`
- Shared UI: `components/`
- Views/pages: `views/`
- AI service wrapper: `services/geminiService.ts`
- Domain models: `types.ts`
- Demo dataset: `constants.ts`
- Next.js migration scaffold: `app/`, `middleware.ts`, `lib/auth/rbac.ts`
- Prisma pipeline: `prisma/schema.prisma`, `prisma/migrations/`, `lib/prisma.ts`
- Auth scaffold: `app/api/auth/*`, `lib/auth/password.ts`, `lib/auth/session.ts`
- RBAC server checks: `lib/auth/server-checks.ts`, `lib/auth/request-session.ts`
- Server-only Gemini path: `app/api/ai/course-draft/route.ts`, `lib/ai/course-draft.ts`
- Courses CRUD APIs: `app/api/courses/route.ts`, `app/api/courses/[id]/route.ts`, `app/api/courses/draft/route.ts`
- Enrollments API: `app/api/enroll/route.ts` (idempotent create via DB unique key handling)
- Moderation APIs: `app/api/courses/[id]/submit/route.ts`, `app/api/admin/courses/submissions/route.ts`, `app/api/admin/courses/[id]/moderate/route.ts`
- Frontend course adapter: `services/courseApiService.ts` (API payload -> frontend model mapping)
- HTTP utility layer: `lib/http/api-error.ts`, `lib/http/validation.ts`, `lib/http/with-api-handler.ts`
- Observability layer: `lib/observability/logger.ts`, `lib/observability/metrics.ts`, `lib/observability/error-tracker.ts`
- Operational endpoints: `app/api/health/route.ts`, `app/api/metrics/route.ts`
- Backup scripts: `ops/backup/postgres-backup.sh`, `ops/backup/postgres-restore-test.sh`
- Backup runbook: `docs/POSTGRES_BACKUP_RUNBOOK.md`
- Secrets validation script: `ops/secrets/validate-env.sh`
- Secrets runbook: `docs/SECRETS_POLICY_RUNBOOK.md`
- UAT smoke script: `ops/uat/smoke-check.sh`
- UAT sign-off template: `docs/STAGING_UAT_SIGNOFF.md`
- Deploy preflight script: `ops/deploy/preflight.sh`
- Deploy/rollback runbook: `docs/DEPLOY_ROLLBACK_RUNBOOK.md`
- Test suite: `tests/unit/`, `tests/integration/`, `tests/e2e/`, `vitest.config.ts`
- CI workflow: `.github/workflows/ci.yml`

Global state is held in React state and passed via `AppContext`.

## 3) View State Machine

`App.tsx` uses `view` with these known values:
- `home`
- `about`
- `language-landing`
- `course-details`
- `tutor-profile`
- `lesson-view`
- `dashboard`
- `catalog`

`dashboard` resolves by `user.role`:
- `ADMIN` -> `AdminDashboard`
- `TUTOR` -> `TutorDashboard`
- `STUDENT` -> `StudentDashboard`

Sidebar display:
- shown only when a `user` exists
- hidden for `lesson-view`

## 4) Cross-View Navigation Dependencies

The following fields are required before entering specific views:
- `language-landing`: `selectedLang`
- `course-details`: `selectedCourse`
- `tutor-profile`: `selectedTutor`
- `lesson-view`: `selectedCourse` and `activeLesson`

If these are unset, the corresponding views currently return `null`.

## 5) Role Simulation Model

No real auth exists. Role switching is performed in `Navbar` by selecting one of `MOCK_USERS` or `Guest`.

Guest behavior:
- can browse public views
- cannot enter meaningful dashboard behavior
- enrollment in course details prompts alert requiring student account

## 6) Course and Lesson Data Contracts

`Course` shape includes:
- metadata: `id`, `title`, `description`, `price`, `imageUrl`
- relational IDs: `tutorId`, `languageId`, `levelId`
- social/progress fields: `studentCount`, `rating`, `reviews`
- learning tree: `syllabus: SyllabusSection[]`

`SyllabusSection`:
- `id`, `title`, `lessons`

`Lesson`:
- `id`, `title`, `duration`, `type`, optional `content`

## 7) AI Generation Flow (Tutor Dashboard)

File path: `views/TutorDashboard.tsx`

Flow:
1. Tutor chooses language, level, topic.
2. `generateCourseDetails(topic, language, level)` is called.
3. Service (`services/geminiService.ts`) calls `/api/ai/course-draft`.
4. Result is transformed into local `Course` object and prepended to state.

Important details:
- model name is `gemini-3-flash-preview`
- Gemini key is consumed server-side by the migration API endpoint
- failures are logged and return `null`
- generated syllabus strings are mapped to sections with empty lesson lists

## 8) Environment and Build Notes

Environment variables:
- `.env.local`: `GEMINI_API_KEY=...`
- `.env.local`: `AUTH_SESSION_SECRET=...`
- `.env.local`: `OBSERVABILITY_ERROR_WEBHOOK_URL=...` (optional)
- `.env.local`: `RESTORE_TEST_DATABASE_URL=...` (required for restore verification)

Expected commands:
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run db:backup`
- `npm run db:restore:test`
- `npm run ops:validate-env`
- `npm run ops:uat:smoke` (set `STAGING_BASE_URL` for real staging target)
- `npm run ops:deploy:preflight`

## 9) Planning Artifacts (Not Yet Implemented)

The following files are strategy/design documents, not runtime code:
- `prisma-schema.txt`
- `folder-structure.txt`
- `rbac-strategy.txt`
- `docs/NEXTJS_ROUTE_MAP.md`

They describe a future architecture with:
- Next.js app router
- Prisma/PostgreSQL schema
- middleware RBAC strategy

Migration update:
- A Next.js route and middleware scaffold now exists in the repository.
- Prisma schema and migration scaffold now exists in the repository.
- Authentication/session scaffold exists for migration APIs and middleware.
- RBAC role checks are enforced in both middleware and protected API handlers.
- Gemini course draft generation is now server-side only and no longer uses client-injected API keys.
- Courses CRUD and AI draft persistence endpoints are implemented for migration APIs.
- Enrollment create/list endpoints are implemented with idempotent replay on duplicates.
- Admin moderation endpoints now handle review submission and approve/reject decisions.
- Frontend course state now prefers DB-backed `/api/courses` data with fallback to mock seed data.
- Core API routes now use centralized validation + normalized error response handling.
- Vitest coverage now includes unit, integration, and E2E critical-flow tests.
- GitHub Actions CI runs Prisma validation, test layers, and Vite production build.
- Observability baseline is wired through `withApiHandler` with request IDs, structured logs, and in-memory metrics snapshots.
- Postgres backup policy + restore validation workflow is documented and scripted under `ops/backup/`.
- Production env/secrets policy and rotation runbook is documented with validation command (`ops:validate-env`).
- Staging UAT sign-off workflow is documented with smoke-check automation.
- Deploy/rollback runbook is documented with preflight automation.
- Default runnable app remains the Vite implementation until Next.js scripts/deps are promoted.

## 10) Known Gaps and Risks

- Default Vite runtime still uses client-side role simulation and fallback mock data.
- Next.js migration APIs require running in Next.js runtime to become the primary path.
- Metrics store is in-memory per process (no long-term retention/export yet).
- Error webhook reporting is optional and requires `OBSERVABILITY_ERROR_WEBHOOK_URL`.
- Secret validation is local-script based; no automated secret-manager sync yet.
- UAT smoke API checks can warn on Vite runtime because migration API routes are not served there.
- No route-level URL deep linking
- Several UI actions are placeholders (logs, approvals, notes, discussion posting)
- Build emits warning because `index.html` references `/index.css` that is not present in repo

Potential maintenance risk:
- `view` is stringly-typed; typo bugs are possible
- state shape is centralized but not enforced by dedicated navigation constants

## 11) Recommended Refactor Path

Short-term hardening in current stack:
1. Replace raw `view` strings with a `ViewId` union type or enum.
2. Introduce central navigation helpers to reduce transition mistakes.
3. Expand automated coverage to component/view transition tests.
4. Add runtime guards for missing selection state with fallback UI.

Migration path to target architecture:
1. Move to Next.js app router.
2. Implement Prisma schema from `prisma-schema.txt`.
3. Add auth provider and role claims.
4. Convert AI generation to server action/API route with audit trail.
5. Replace mock data with DB-backed repositories.

## 12) Update Protocol for Future Agents

When implementation changes:
1. Update `README.md` (external contributor view).
2. Update this file (`docs/CODEX_CONTEXT.md`) for technical handoff.
3. Update `docs/DEPLOYMENT_PLAN_TODO.md` for rollout status and next step.
4. Update `AGENTS.md` when behavior/process conventions changed.
5. Run `npm run build` before finalizing.
