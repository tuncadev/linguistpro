# Codex Context: LinguistPro

Last verified: 2026-04-28

This file is a technical handoff reference for future Codex sessions.

## 1) What the Repository Is

LinguistPro is now running on Next.js App Router with:
- role-based auth/session APIs
- RBAC-protected endpoints
- Prisma-backed data services for migration paths

Legacy Vite prototype files are still present and used as migration references.

## 2) Actual Runtime Composition

- Primary runtime: `app/` (Next.js App Router)
- Proxy/route guard: `middleware.ts` (to be migrated to `proxy.ts` for Next 16 convention)
- Auth/session APIs: `app/api/auth/*`
- Auth hardening helpers: `lib/auth/tokens.ts`, `lib/security/rate-limit.ts`
- Auth UI: `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
- Legacy styled auth UI: `components/Navbar.tsx` modal wired to `/api/auth/*`
- Legacy Vite shell retained: `index.tsx`, `App.tsx`, `views/`, `components/`
- Prisma pipeline: `prisma/schema.prisma`, `prisma/migrations/`, `lib/prisma.ts`
- Prisma seed utility: `prisma/seed.mjs`
- Auth scaffold: `app/api/auth/*`, `lib/auth/password.ts`, `lib/auth/session.ts`
- Auth token/lockout model fields: `User.emailVerifiedAt`, `User.failedLoginAttempts`, `User.lockedUntil`, `AuthToken`
- Student onboarding model fields: `User.onboardingCompletedAt`, `User.welcomeDismissedAt`
- Tutor governance model fields: `User.tutorApprovalStatus`, `User.tutorApprovedAt`, `User.tutorApprovalNotes`
- RBAC server checks: `lib/auth/server-checks.ts`, `lib/auth/request-session.ts`
- RBAC matrix + audit tests: `docs/RBAC_PERMISSION_MATRIX.md`, `tests/unit/rbac-permissions.unit.test.ts`
- Server-only Gemini path: `app/api/ai/course-draft/route.ts`, `lib/ai/course-draft.ts`
- Courses CRUD APIs: `app/api/courses/route.ts`, `app/api/courses/[id]/route.ts`, `app/api/courses/draft/route.ts`
- Course lifecycle policy + audit helper: `docs/COURSE_LIFECYCLE.md`, `lib/courses/lifecycle.ts`
- Learning access guard API + helper: `app/api/learning/access/route.ts`, `lib/learning/access.ts`
- Server component session helper: `lib/auth/server-session.ts`
- Zoom OAuth integration APIs: `app/api/integrations/zoom/oauth-url/route.ts`, `app/api/integrations/zoom/connect/route.ts`, `app/api/integrations/zoom/status/route.ts`
- Zoom token helpers + storage: `lib/integrations/zoom/oauth.ts`, `lib/integrations/zoom/token-store.ts`, `lib/security/sealed-secrets.ts`
- Zoom integration runbook: `docs/ZOOM_INTEGRATION.md`
- Live class APIs: `app/api/live-classes/route.ts`, `app/api/live-classes/[id]/join/route.ts`
- Live class serialization: `lib/live-classes/serialize.ts`
- Live class runbook: `docs/ZOOM_LIVE_CLASSES.md`
- Zoom webhook sync endpoint: `app/api/webhooks/zoom/route.ts`
- Zoom webhook helpers: `lib/integrations/zoom/webhook.ts`, `lib/integrations/zoom/sync.ts`
- Attendance/recording runbook: `docs/ZOOM_ATTENDANCE_RECORDINGS.md`
- Transactional communications dispatcher/workflows: `lib/communications/dispatcher.ts`, `lib/communications/workflows.ts`, `lib/communications/templates.ts`
- Transactional communications APIs: `app/api/live-classes/[id]/remind/route.ts`, `app/api/live-classes/[id]/cancel/route.ts`, `app/api/admin/communications/send/route.ts`
- Transactional communications runbook: `docs/TRANSACTIONAL_COMMUNICATIONS.md`
- Admin KPI dashboard runbook: `docs/ADMIN_KPI_DASHBOARD.md`
- Next.js admin section layout (left navigation): `app/(dashboard)/admin/layout.tsx`
- Next.js admin course CRUD page: `app/(dashboard)/admin/courses/page.tsx`
- Next.js admin tutor CRUD page: `app/(dashboard)/admin/tutors/page.tsx`
- Next.js admin tutor detail edit page: `app/(dashboard)/admin/tutors/[id]/page.tsx`
- Enrollments API: `app/api/enroll/route.ts` (idempotent create via DB unique key handling)
- Learning route guard page: `app/learn/[courseId]/[lessonId]/page.tsx` (server-side session + enrollment/ownership enforcement)
- Student onboarding APIs: `app/api/student/onboarding/route.ts`, `app/api/student/welcome/route.ts`
- Tutor onboarding API: `app/api/tutor/onboarding/route.ts`
- Admin tutor approval API: `app/api/admin/tutors/[id]/approve/route.ts`
- Student onboarding page: `app/(dashboard)/student/my-learning/page.tsx`
- Tutor governance page: `app/(dashboard)/tutor/my-courses/page.tsx`
- Moderation APIs: `app/api/courses/[id]/submit/route.ts`, `app/api/admin/courses/submissions/route.ts`, `app/api/admin/courses/[id]/moderate/route.ts`
- Feature flag APIs: `app/api/feature-flags/route.ts`, `app/api/admin/feature-flags/route.ts`, `app/api/admin/feature-flags/[key]/route.ts`
- Feature flag server helper: `lib/feature-flags/is-enabled.ts`
- Frontend course adapter: `services/courseApiService.ts` (API payload -> frontend model mapping)
- Frontend enrollment adapter: `services/enrollmentApiService.ts` (`GET/POST /api/enroll` bridge for legacy views)
- Frontend taxonomy adapter: `services/taxonomyApiService.ts` (`GET /api/taxonomies`)
- Frontend tutor adapter: `services/tutorApiService.ts` (`GET /api/tutors`)
- Frontend demo-user adapter: `services/demoUserApiService.ts` (`GET /api/demo-users`)
- Frontend admin overview adapter: `services/adminDashboardApiService.ts` (`GET /api/admin/dashboard/overview`)
- Frontend admin course CRUD adapter: `services/adminCourseCrudApiService.ts` (`/api/courses` + `/api/courses/:id`)
- Frontend admin tutor CRUD adapter: `services/adminTutorCrudApiService.ts` (`/api/admin/tutors` + `/api/admin/tutors/:id`)
- Taxonomy/tutor APIs: `app/api/taxonomies/route.ts`, `app/api/tutors/route.ts`
- Admin tutor APIs: `app/api/admin/tutors/route.ts`, `app/api/admin/tutors/[id]/route.ts`
- Demo role user API: `app/api/demo-users/route.ts`
- Admin overview API: `app/api/admin/dashboard/overview/route.ts`
- HTTP utility layer: `lib/http/api-error.ts`, `lib/http/validation.ts`, `lib/http/with-api-handler.ts`
- Observability layer: `lib/observability/logger.ts`, `lib/observability/metrics.ts`, `lib/observability/error-tracker.ts`
- Operational endpoints: `app/api/health/route.ts`, `app/api/metrics/route.ts`
- Backup scripts: `ops/backup/postgres-backup.sh`, `ops/backup/postgres-restore-test.sh`
- Backup runbook: `docs/POSTGRES_BACKUP_RUNBOOK.md`
- Secrets validation script: `ops/secrets/validate-env.sh`
- Secrets runbook: `docs/SECRETS_POLICY_RUNBOOK.md`
- UAT smoke script: `ops/uat/smoke-check.sh`
- UAT tutor consistency script: `ops/uat/tutor-consistency-check.mjs`
- UAT sign-off template: `docs/STAGING_UAT_SIGNOFF.md`
- Tutor mismatch investigation runbook: `docs/TUTOR_MISMATCH_INVESTIGATION.md`
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

Both real session auth and demo role switching exist in `Navbar`.
- Real session auth: styled modal calling `/api/auth/login` and `/api/auth/register` with verification-required handling.
- Demo role switch: selecting one of backend-loaded demo users from `/api/demo-users` (or `Guest`) still overrides context for prototype flows.

Guest behavior:
- can browse public views
- cannot enter meaningful dashboard behavior
- enrollment in course details prompts alert requiring student account

## 6) Course and Lesson Data Contracts

`Course` shape includes:
- metadata: `id`, `title`, `description`, `price`, `imageUrl`
- optional lifecycle: `status` (`DRAFT | PENDING_REVIEW | PUBLISHED | ARCHIVED`)
- lifecycle audit snapshot: `publishedAt`, `submittedAt`, `reviewedAt`, `archivedAt`, `statusReason`, `statusChangedById`, `statusChangedAt`
- relational IDs: `tutorId`, `languageId`, `levelId`
- social/progress fields: `studentCount`, `rating`, `reviews`
- details presentation fields:
  - `learningObjectives: string[]`
  - `enrollmentIncludes: string[]`
  - `tuitionLabel: string`
  - `discountLabel: string`
  - `courseDirectorLabel: string`
- learning tree: `syllabus: SyllabusSection[]`

`SyllabusSection`:
- `id`, `title`, `lessons`

`Lesson`:
- `id`, `title`, `duration`, `type`, optional `content`

Lifecycle audit persistence:
- `CourseLifecycleEvent` table logs every status transition with `fromStatus`, `toStatus`, actor, reason, metadata, and timestamp.

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
- `.env.local`: `ZOOM_CLIENT_ID=...`
- `.env.local`: `ZOOM_CLIENT_SECRET=...`
- `.env.local`: `ZOOM_REDIRECT_URI=...`
- `.env.local`: `INTEGRATION_ENCRYPTION_KEY=...` (base64-encoded 32-byte key)
- `.env.local`: `OBSERVABILITY_ERROR_WEBHOOK_URL=...` (optional)
- `.env.local`: `EMAIL_DELIVERY_WEBHOOK_URL=...` (optional delivery provider endpoint; production should set)
- `.env.local`: `RESTORE_TEST_DATABASE_URL=...` (required for restore verification)

Expected commands:
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run prisma:seed`
- `npm run db:backup`
- `npm run db:restore:test`
- `npm run ops:validate-env`
- `npm run ops:uat:smoke` (set `STAGING_BASE_URL` for real staging target)
- `npm run ops:uat:roles` (full student/tutor/admin API flow check)
- `npm run ops:uat:signoff` (runs smoke+roles and writes sign-off summary/row snippet)
- `npm run ops:deploy:preflight`
- `npm run ops:deploy:launch` (production launch gate; writes report to `ops/deploy/reports/`)

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
- Next.js runtime is now the default runnable app path.
- Local Postgres-backed auth flow is validated end-to-end (`/api/auth/register`, `/api/auth/login`, `/api/auth/session`).
- Legacy frontend `Log In`/`Start Free Trial` buttons are now backend-wired via auth modal.
- Legacy `CourseDetailsView` enrollment button now calls `/api/enroll`; `StudentDashboard` now prefers `/api/enroll` IDs for "In Progress" with local fallback.
- Full local role-flow UAT automation exists at `ops/uat/role-flow-check.sh` with report output under `ops/uat/reports/`.
- Staging UAT orchestration exists at `ops/uat/staging-signoff.sh` (runs smoke + role-flow and emits sign-off row snippet/report).
- Deploy preflight has been validated locally with env-policy mode using `NODE_ENV=production ENV_FILE=.env.local npm run ops:deploy:preflight`.
- Backup and restore scripts now normalize Prisma-style `schema` URL params before invoking PostgreSQL CLI tools (`pg_dump`, `pg_restore`, `psql`).
- Automated production launch checklist exists at `ops/deploy/launch-checklist.sh` and supports dry-run evidence generation.
- Latest launch checklist was executed with explicit staging waiver override pending real staging QA completion.
- Feature flag foundation is now implemented with Prisma model, seeded defaults, admin CRUD APIs, and public read endpoint.
- Legacy frontend taxonomy/tutor/demo-role hardcoded paths are now backend-first via `/api/taxonomies`, `/api/tutors`, and `/api/demo-users` with fallback constants in `App.tsx`.
- Auth API payloads now include user profile metadata (`avatarUrl`, `bio`, `rating`, `studentCount`, `coursesAuthored`) and frontend auth mapping uses those fields.
- Auth hardening now includes: email verification endpoint pair, password-reset endpoint pair, login brute-force lockout, and route-level IP rate limiting.
- Student onboarding flow is implemented and tested through `/api/student/onboarding`, `/api/student/welcome`, and `/student/my-learning`.
- Tutor onboarding/governance is implemented and tested through `/api/tutor/onboarding`, `/api/admin/tutors/:id/approve`, and publish-path approval checks.
- Admin dashboard cards, recent submissions, and activity feed are backend-driven via `/api/admin/dashboard/overview`.
- Next.js `/admin/courses` is no longer scaffold and now supports admin add/edit/remove against backend course APIs with dynamic taxonomy/tutor selectors.
- Admin `/api/courses` creation now supports admin-controlled status (including direct `PUBLISHED`) and detail-page content fields.
- Seed data now syncs legacy frontend catalog courses into DB with published status and full details-page content fields.
- `CourseDetailsView` now renders objectives/enrollment/labels from backend course payload instead of frontend hardcoded arrays.
- `CourseDetailsView` now has admin-only inline edit mode in legacy UI layout and saves to backend via `updateAdminCourse(...)`.
- `PATCH /api/courses/:id` now supports structured `syllabusSections` updates (section titles + lesson title/type/duration/content), not only flat `syllabus` section-title arrays.
- Admin sidebar includes a direct `Courses Page` link in the Administration group.
- Admin tutor management is implemented at `/admin/tutors` with add/edit/remove wiring via `/api/admin/tutors` and `/api/admin/tutors/:id`.
- Legacy `TutorProfileView` now supports admin-only in-place edit mode (same UI layout with input substitution), matching `CourseDetailsView` edit behavior.
- Tutor profile metadata now includes backend fields for `location`, `languagesSpoken`, `profileHighlights` (list), `profileStats` (modules), and `pedagogicalModules` (modules); tutor APIs serialize these with defaults.
- Admin dashboard routes now render with a persistent left navigation (`Courses`, `Tutors`, `Users`, `Taxonomies`).
- Tutor list APIs now auto-provision a default tutor profile from legacy frontend tutor data when no tutors exist, and also repair course assignments that reference non-tutor users.
- Course creation and AI draft APIs now enforce `tutorId` to be a real `TUTOR` role account (admins cannot assign non-tutor users).
- Course presentation label baseline is normalized to `Course Tutor` (including legacy `Course Director` DB values during serialization).
- Course lifecycle is now transition-guarded with persisted audit events (`CourseLifecycleEvent`) and status snapshots (`submittedAt`, `reviewedAt`, `archivedAt`, actor/reason fields).
- Zoom integration foundation is now implemented with encrypted OAuth token storage (`ZoomConnection`) and token refresh-capable integration endpoints under `/api/integrations/zoom/*`.
- Live class scheduling is now implemented with persisted `LiveClassSession` records and Zoom-backed meeting creation/join-link delivery (`/api/live-classes*`).
- Zoom attendance and recording sync is now implemented with webhook verification and persistence (`LiveClassAttendance`, `LiveClassRecording`).
- Transactional communications are now implemented with persisted outbox/attempts, retries, and workflow triggers for welcome/enrollment/reminder/cancellation.
- Admin dashboard overview now includes production KPI payloads for funnel, live-class, attendance/recording, and communications performance metrics.

## 10) Known Gaps and Risks

- Legacy Vite shell still contains fallback data paths in `App.tsx` when API data is unavailable.
- Next.js 16 warns that `middleware.ts` should migrate to `proxy.ts`.
- Metrics store is in-memory per process (no long-term retention/export yet).
- Error webhook reporting is optional and requires `OBSERVABILITY_ERROR_WEBHOOK_URL`.
- Secret validation is local-script based; no automated secret-manager sync yet.
- Local UAT smoke can warn if pointed at legacy Vite runtime instead of Next service URL.
- No route-level URL deep linking
- Several UI actions are placeholders (approval/reject buttons, notes, discussion posting)
- Vite legacy build emits warning because `index.html` references `/index.css` that is not present in repo

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
