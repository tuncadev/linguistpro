# LinguistPro

LinguistPro is a Next.js + React language-learning platform work-in-progress with role-based dashboards for `STUDENT`, `TUTOR`, and `ADMIN`, plus Gemini-powered course draft generation for tutors.

Current runtime shape:
- default runtime is Next.js App Router (`app/`)
- Vite legacy prototype shell is still available under root SPA files (`App.tsx`, `views/`, `components/`)
- authentication and core APIs are wired under `app/api/*`

## Project Status

The repository now runs primarily on Next.js (App Router), while legacy Vite prototype files are still present during migration.
Planning artifacts (`prisma-schema.txt`, `folder-structure.txt`, `rbac-strategy.txt`) remain as design references.

## Tech Stack

- Next.js `16`
- React `19`
- TypeScript `5`
- Vite `6` (legacy prototype runtime)
- Tailwind utility classes (via CDN script in `index.html`)
- `@google/genai` (`GoogleGenAI`) for tutor AI course draft generation
- `lucide-react` icons

## Core Features

- Public marketing/home experience with language landing pages
- Course catalog with language filtering
- Course details with syllabus drill-down
- Lesson player view shell with module navigation/resources/notes/discussion tabs
- Role-specific dashboards for:
- `STUDENT` (in-progress learning, streak card, upcoming class panel)
- `TUTOR` (AI course generation + authored course list)
- `ADMIN` (DB-backed overview stats + recent submissions + activity feed)
- Tutor profile view with course offerings
- Navbar role switcher (backend-loaded demo profiles)
- Next.js admin course page with CRUD (`/admin/courses`) for add/edit/remove via backend APIs
- Next.js admin tutor page with CRUD (`/admin/tutors`) for add/edit/remove via backend APIs

## High-Level Architecture

`App.tsx` owns global app state via `AppContext`:
- `user`
- `demoUsers`
- `tutors`
- `courses`
- `languages`
- `levels`
- `view`
- `selectedLang`
- `selectedCourse`
- `selectedTutor`
- `activeLesson`

View rendering is controlled by `view` (string-based state machine), not React Router.

Main render flow:
1. `index.tsx` mounts `<App />`.
2. `App.tsx` provides context and chooses active view in `renderView()`.
3. `Navbar` and `Sidebar` trigger state changes (`setView`, `setUser`, selection setters).
4. View components consume context and update it for navigation transitions.

## Data Model (Frontend Types)

Defined in `types.ts`:
- `User`, `UserRole`
- `Language`
- `Level`
- `Lesson`
- `SyllabusSection`
- `Course`
- `Enrollment`

Fallback/mock seed data is in `constants.ts`:
- `LANGUAGES`
- `LEVELS`
- `MOCK_USERS`
- `MOCK_COURSES`

## AI Integration

`services/geminiService.ts` exposes:
- `generateCourseDetails(topic, language, level)`

Behavior:
1. Calls `POST /api/ai/course-draft`.
2. Server utility uses Gemini model `gemini-3-flash-preview`.
3. Requests strict JSON response schema:
- `title: string`
- `description: string`
- `syllabus: string[]`
- `price: number`
4. Returns parsed JSON payload to the frontend service.

In tutor dashboard (`views/TutorDashboard.tsx`):
- Result is converted into a local `Course` object.
- Missing optional backend data is mocked (`rating`, `reviews`, empty lesson arrays per syllabus section).
- New course is prepended to in-memory state only.

## Environment Variables

Create/update `.env.local`:

```env
GEMINI_API_KEY=your_real_key_here
```

Gemini key is used server-side by the migration endpoint (`/api/ai/course-draft`).

If no valid key is set, AI generation fails gracefully and returns `null`.

Authentication/session env:
- `AUTH_SESSION_SECRET` must be set for signed session cookies.
- `AUTH_ALLOW_DEV_ROLE_HEADER` controls whether `x-dev-role` header fallback is accepted (`false` by default).

Observability env:
- `OBSERVABILITY_ERROR_WEBHOOK_URL` (optional): receives JSON error events for 5xx API failures.

Backup/restore env:
- `DATABASE_URL`: source Postgres database.
- `RESTORE_TEST_DATABASE_URL`: isolated database used only for restore verification.

Production env policy:
- See `docs/SECRETS_POLICY_RUNBOOK.md` for required secrets and rotation workflow.

## Prisma Pipeline (Implemented)

Prisma assets now exist for the production migration path:
- schema: `prisma/schema.prisma`
- initial SQL migration scaffold: `prisma/migrations/20260426170000_init/migration.sql`
- Prisma client singleton: `lib/prisma.ts`

Available scripts:
- `npm run prisma:format`
- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run prisma:seed`
- `npm run prisma:migrate:dev`
- `npm run prisma:migrate:deploy`
- `npm run prisma:studio`

Local seed defaults (for auth testing):
- `admin@linguistpro.local / Admin123!`
- `tutor@linguistpro.local / Tutor123!`
- `student@linguistpro.local / Student123!`

## Auth and Session Scaffold (Implemented)

Server-side auth/session scaffold is implemented for the Next.js migration path:
- password hashing: `lib/auth/password.ts`
- session JWT signing/verification: `lib/auth/session.ts`
- middleware session role extraction: `middleware.ts`

Auth API routes:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

Legacy frontend wiring update:
- Navbar `Log In` / `Start Free Trial` now use a styled auth modal and call the backend auth APIs.
- Session is restored on app load via `GET /api/auth/session`.
- `CourseDetailsView` `Enroll Today` now calls `POST /api/enroll` for student accounts, then continues into lesson view.

## RBAC Middleware and Server Checks (Implemented)

RBAC is now enforced at two layers:
- route middleware for dashboard paths (`/student/*`, `/tutor/*`, `/admin/*`) in `middleware.ts`
- server-side API guards in `lib/auth/server-checks.ts` using `requireRoles(...)`

Protected API examples:
- `POST /api/courses` -> `TUTOR` or `ADMIN`
- `POST /api/enroll` -> `STUDENT`
- `POST /api/webhooks` -> `ADMIN`

## Gemini Server-Only Integration (Implemented)

Gemini course-draft generation is now server-only:
- server utility: `lib/ai/course-draft.ts`
- protected endpoint: `POST /api/ai/course-draft` (`TUTOR` or `ADMIN`)
- client service now calls endpoint: `services/geminiService.ts`

Security note:
- `GEMINI_API_KEY` is no longer injected into Vite client build config.
- API key remains server-side only.

## Courses CRUD and Draft APIs (Implemented)

Core course APIs (Next.js migration path):
- `GET /api/courses` (public published list; role-aware filters for admin/tutor)
- `POST /api/courses` (`TUTOR`/`ADMIN`: create course; admin can set/create as `PUBLISHED`)
- `GET /api/courses/:id` (published or authorized owner/admin)
- `PATCH /api/courses/:id` (owner tutor or admin updates)
- `DELETE /api/courses/:id` (owner tutor for non-published, or admin)
- `POST /api/courses/draft` (`TUTOR`/`ADMIN`: generate + persist AI draft)

Serialization helper:
- `lib/courses/serialize.ts` normalizes Prisma payloads (including Decimal to number).

## Enrollments API with Idempotency (Implemented)

Enrollment endpoints:
- `GET /api/enroll` (role-aware listing)
- `POST /api/enroll` (creates enrollment)

Idempotency behavior:
- DB uniqueness on `(courseId, studentId)` prevents duplicates.
- Repeated enrollment calls for the same user/course return existing enrollment (`idempotentReplay: true`) instead of creating a new record.
- Supports optional `Idempotency-Key` header echo for client retry tracing.

## Admin Moderation Flow (Implemented)

Course moderation endpoints:
- `POST /api/courses/:id/submit` (`TUTOR`/`ADMIN`): submit draft to review (`PENDING_REVIEW`)
- `GET /api/admin/courses/submissions` (`ADMIN`): list pending review queue
- `POST /api/admin/courses/:id/moderate` (`ADMIN`): `APPROVE` (publish) or `REJECT` (return to draft)

## Admin Course CRUD Page (Implemented)

Next.js admin route is now functional:
- `GET /admin/courses`

Implemented behavior:
- loads dynamic courses from `GET /api/courses?includeUnpublished=true`
- creates courses through `POST /api/courses`
- edits courses through `PATCH /api/courses/:id`
- removes courses through `DELETE /api/courses/:id`
- create form now exposes backend detail-content fields used by course details page (objectives, enrollment includes, labels)
- uses dynamic taxonomy/tutor selectors from `/api/taxonomies` and `/api/tutors`
- keeps static summary cards while rendering DB-backed course list/actions

## Admin Tutor CRUD Page (Implemented)

Next.js admin route is now functional:
- `GET /admin/tutors`

Implemented behavior:
- loads tutors from `GET /api/admin/tutors`
- creates tutors through `POST /api/admin/tutors`
- edits tutors through `PATCH /api/admin/tutors/:id`
- removes tutors through `DELETE /api/admin/tutors/:id`
- supports tutor edits from legacy `TutorProfileView` in-place (`Single Course -> Course Tutor -> Edit Tutor`) with the same page layout
- auto-provisions a default tutor record from legacy frontend profile data when tutor table is empty
- blocks delete when tutor still owns courses (reassign/remove courses first)
- preserves existing frontend tutor profile/card style while shifting data source to DB APIs

## Taxonomy and Tutor Directory APIs (Implemented)

Backend APIs for replacing static frontend taxonomy/tutor data:
- `GET /api/taxonomies` (public): returns `languages` and `levels`
- `GET /api/tutors` (public): returns tutor directory metadata for profile cards/details
- `GET /api/admin/tutors` (`ADMIN`): admin tutor list with login readiness metadata
- `POST /api/admin/tutors` (`ADMIN`): create tutor user with password
- `PATCH /api/admin/tutors/:id` (`ADMIN`): edit tutor profile/login fields
- `DELETE /api/admin/tutors/:id` (`ADMIN`): delete tutor when no courses are assigned
- `GET /api/demo-users` (public): returns one demo profile per role for navbar quick role switching
- `GET /api/admin/dashboard/overview` (`ADMIN`): returns admin stats, recent course submissions, and activity feed

## Feature Flags Foundation (Implemented)

Feature flag data model and APIs are now available:
- DB model: `FeatureFlag` in `prisma/schema.prisma`
- server helper: `lib/feature-flags/is-enabled.ts`
- public read endpoint: `GET /api/feature-flags`
- admin endpoints (`ADMIN`):
  - `GET /api/admin/feature-flags`
  - `POST /api/admin/feature-flags`
  - `GET /api/admin/feature-flags/:key`
  - `PATCH /api/admin/feature-flags/:key`
  - `DELETE /api/admin/feature-flags/:key`

Seeded default flags:
- `billing_v1`
- `email_workflows_v1`
- `recommendations_v1`

## Replacing Mock Paths with DB-backed Services

Course read paths are now API-first:
- `services/courseApiService.ts` fetches `/api/courses` and maps API payload to frontend `Course`.
- `App.tsx` initializes `courses` from API and falls back to `MOCK_COURSES` only when backend fetch fails (`null`), not when DB returns empty list.
- `LanguageLandingView` and `StudentDashboard` now consume context `courses` instead of hardcoded `MOCK_COURSES`.
- `services/enrollmentApiService.ts` now bridges legacy frontend enrollment flows to `/api/enroll`.
- `StudentDashboard` now derives "In Progress" from `GET /api/enroll` course IDs with fallback to existing local slice behavior when backend data is unavailable.
- `services/taxonomyApiService.ts` now bridges frontend language/level lists to `/api/taxonomies`.
- `services/tutorApiService.ts` now bridges frontend tutor metadata to `/api/tutors`.
- `services/demoUserApiService.ts` now bridges navbar role-switch profiles to `/api/demo-users`.
- `services/adminDashboardApiService.ts` now powers `AdminDashboard` cards/submissions/activity from `/api/admin/dashboard/overview`.
- `services/adminCourseCrudApiService.ts` now powers Next.js admin course management page actions (create/update/delete/list).
- `services/adminTutorCrudApiService.ts` now powers Next.js admin tutor management page actions (create/update/delete/list).
- `HomeView`, `CourseCatalog`, `LanguageLandingView`, `TutorDashboard`, and `CourseDetailsView` now use AppContext `languages`, `levels`, and `tutors` loaded from backend-first sources with static fallback.
- `Navbar` role buttons now use backend-loaded `demoUsers` from `AppContext`; `services/authApiService.ts` maps avatar/profile metadata from auth payloads instead of `MOCK_USERS`.
- `StudentDashboard` upcoming class card now derives course/tutor details from backend-backed context state.
- `CourseDetailsView` hero/objectives/enroll-card content (course director label, learning objectives, enrollment includes, tuition/discount labels) now reads backend course fields.
- `CourseDetailsView` tutor header label now uses `Course Tutor`; edit mode always lists current tutor directory for assignment.
- `TutorProfileView` now supports admin-only in-place editing on the same visual layout (`Edit Tutor`), mirroring the course details edit pattern.
- Tutor profile sections are now backend-driven and editable: `Location`, `Languages`, modular `Profile Stats`, profile highlight list, and modular `Pedagogical Approach`.
- `CourseDetailsView` now supports admin-only in-place editing on the same frontend layout (`Edit Course`), saving directly to DB via `PATCH /api/courses/:id`.
- Curriculum editing on course details page now persists section/lesson details through `syllabusSections` payload support in `PATCH /api/courses/:id`.
- Sidebar admin section now includes a `Courses Page` shortcut that routes to the legacy catalog view (`view='catalog'`).

## Centralized API Error Handling and Validation (Implemented)

Shared HTTP utilities:
- `lib/http/api-error.ts` (typed API errors)
- `lib/http/validation.ts` (`parseJsonBody`, `parseQuery`)
- `lib/http/with-api-handler.ts` (standardized error normalization for route handlers)

Applied to core production routes:
- courses CRUD/draft routes
- enrollments route
- moderation routes

## Observability Baseline (Implemented)

Shared observability modules:
- `lib/observability/logger.ts` (structured JSON logs)
- `lib/observability/metrics.ts` (runtime request counters and status-class metrics)
- `lib/observability/error-tracker.ts` (optional webhook forwarding for 5xx errors)

Automatic API instrumentation:
- `lib/http/with-api-handler.ts` now emits/propagates `x-request-id`
- records per-request duration/status metrics
- logs success/failure with request context
- returns `requestId` in normalized error payloads

Operational endpoints:
- `GET /api/health` (liveness + uptime)
- `GET /api/metrics` (`ADMIN` role required)

## Getting Started

### Prerequisites

- Node.js `>= 18.18` (Node 20+ recommended)
- npm `>= 9`

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

Default dev server settings:
- host: `0.0.0.0`
- port: `3000`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run start
```

### Run Test Suite

```bash
npm run test
```

Layer-specific runs:
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`

## CI/CD Checks

GitHub Actions workflow: `.github/workflows/ci.yml`

Checks executed on pull requests and protected branch pushes:
- `npm ci`
- `npm run prisma:validate`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`
- `npm run build`

## Backup and Restore Policy

Runbook: `docs/POSTGRES_BACKUP_RUNBOOK.md`

Operational scripts:
- `npm run db:backup`
- `npm run db:restore:test`

Both scripts support `DRY_RUN=1` for command-path validation without touching databases.
Backup/restore scripts also normalize Prisma-style DB URLs by stripping `schema` query params for PostgreSQL CLI compatibility.

## Secrets and Env Validation

Runbook: `docs/SECRETS_POLICY_RUNBOOK.md`

Validation command:
- `npm run ops:validate-env`

## Staging UAT Sign-Off

Runbook/template: `docs/STAGING_UAT_SIGNOFF.md`

Smoke command:
- `STAGING_BASE_URL=https://staging.example.com npm run ops:uat:smoke`
- `STAGING_BASE_URL=https://staging.example.com npm run ops:uat:roles`
- `STAGING_BASE_URL=https://staging.example.com QA_OWNER="QA Lead" PRODUCT_OWNER="PO Name" NOTES="RC1" npm run ops:uat:signoff`

## Deploy and Rollback

Runbook: `docs/DEPLOY_ROLLBACK_RUNBOOK.md`

Preflight command:
- `npm run ops:deploy:preflight`
- `NODE_ENV=production ENV_FILE=.env.local npm run ops:deploy:preflight` (local production-like validation)

Launch checklist command:
- `npm run ops:deploy:launch`
- `STAGING_UAT_SIGNED_OFF=true CI_GREEN=true ENV_FILE=.env.production PRODUCTION_BASE_URL=https://app.example.com npm run ops:deploy:launch`
- `DRY_RUN=1 STAGING_UAT_SIGNED_OFF=true CI_GREEN=true npm run ops:deploy:launch` (workflow dry-run)

## Directory Map

```text
.
├── App.tsx
├── index.tsx
├── index.html
├── components/
│   ├── Hero.tsx
│   ├── LanguageCard.tsx
│   ├── Navbar.tsx
│   └── Sidebar.tsx
├── views/
│   ├── AboutView.tsx
│   ├── AdminDashboard.tsx
│   ├── CourseCatalog.tsx
│   ├── CourseDetailsView.tsx
│   ├── HomeView.tsx
│   ├── LanguageLandingView.tsx
│   ├── LessonView.tsx
│   ├── StudentDashboard.tsx
│   ├── TutorDashboard.tsx
│   └── TutorProfileView.tsx
├── services/
│   └── geminiService.ts
├── constants.ts
├── types.ts
├── prisma-schema.txt
├── folder-structure.txt
├── rbac-strategy.txt
└── migrated_prompt_history/
```

## Planning Artifacts vs Current Implementation

Files:
- `prisma-schema.txt`
- `folder-structure.txt`
- `rbac-strategy.txt`
- `docs/NEXTJS_ROUTE_MAP.md`

These describe and guide the migration to the Next.js/Prisma architecture.

Current implementation serves Next.js runtime by default. Vite SPA files remain for migration reference and fallback development paths.

## Known Limitations

- Legacy Vite UI still contains demo-role behavior and mock-heavy views
- Route state is string-based and local (not URL-driven)
- Actions like enrollment, approval, notes, and discussion are UI-only placeholders
- `index.html` references `/index.css`, but no local `index.css` exists (Vite warns during build)
- Next.js middleware/proxy compatibility needs final cleanup (`middleware.ts` deprecation warning in Next 16)

## Recommended Next Implementation Steps

1. Complete staging UAT on real staging URL and record sign-off.
2. Execute production launch checklist.
3. Replace remaining legacy Vite mock-only screens with Next.js pages.
4. Promote route-by-route data loading to DB-backed APIs.
5. Resolve Next 16 middleware-to-proxy deprecation.

## Codex Handoff Files

For future agent sessions, see:
- `AGENTS.md` (project-specific Codex operating instructions)
- `docs/CODEX_CONTEXT.md` (deep technical context)
- `docs/DEPLOYMENT_PLAN_TODO.md` (execution tracker and next action)
- `docs/INFRA_DECISION.md` (final infrastructure choices for deployment)
- `docs/NEXTJS_ROUTE_MAP.md` (target route design and current mapping)
- `docs/LOCAL_SERVICE.md` (systemd service to keep local dev server running)
- `docs/POSTGRES_BACKUP_RUNBOOK.md` (backup/restore policy + scripts usage)
- `docs/SECRETS_POLICY_RUNBOOK.md` (production env/secrets rotation + validation)
- `docs/STAGING_UAT_SIGNOFF.md` (staging acceptance checklist + sign-off log)
- `docs/DEPLOY_ROLLBACK_RUNBOOK.md` (deploy preflight + rollback process)
- `.agents/skills/linguistpro-maintainer/` (project-local reusable Codex skill)
