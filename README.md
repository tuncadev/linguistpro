# LinguistPro

LinguistPro is a React + Vite language-learning platform prototype with role-based dashboards for `STUDENT`, `TUTOR`, and `ADMIN`, plus Gemini-powered course draft generation for tutors.

This project currently behaves as a frontend-first simulation:
- default runtime is still Vite SPA demo mode
- Next.js API + Prisma migration layer exists under `app/`, `lib/`, and `prisma/`
- role switching in the Vite shell remains demo-mode via in-memory mock users

## Project Status

The codebase is a single-page app with app-level context state and view switching via string IDs.  
It includes architecture planning artifacts (`prisma-schema.txt`, `folder-structure.txt`, `rbac-strategy.txt`) for a future Next.js + Prisma implementation.

## Tech Stack

- React `19`
- TypeScript `5`
- Vite `6`
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
- `ADMIN` (overview stats + recent submissions + system logs mock)
- Tutor profile view with course offerings
- Navbar role switcher for demoing role states

## High-Level Architecture

`App.tsx` owns global app state via `AppContext`:
- `user`
- `courses`
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

Mock seed data is in `constants.ts`:
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

## Prisma Pipeline (Implemented)

Prisma assets now exist for the production migration path:
- schema: `prisma/schema.prisma`
- initial SQL migration scaffold: `prisma/migrations/20260426170000_init/migration.sql`
- Prisma client singleton: `lib/prisma.ts`

Available scripts:
- `npm run prisma:format`
- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev`
- `npm run prisma:migrate:deploy`
- `npm run prisma:studio`

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
- `POST /api/courses` (`TUTOR`/`ADMIN`: create draft course)
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

## Replacing Mock Paths with DB-backed Services

Course read paths are now API-first:
- `services/courseApiService.ts` fetches `/api/courses` and maps API payload to frontend `Course`.
- `App.tsx` initializes `courses` from API and falls back to `MOCK_COURSES` when backend data is unavailable.
- `LanguageLandingView` and `StudentDashboard` now consume context `courses` instead of hardcoded `MOCK_COURSES`.

## Centralized API Error Handling and Validation (Implemented)

Shared HTTP utilities:
- `lib/http/api-error.ts` (typed API errors)
- `lib/http/validation.ts` (`parseJsonBody`, `parseQuery`)
- `lib/http/with-api-handler.ts` (standardized error normalization for route handlers)

Applied to core production routes:
- courses CRUD/draft routes
- enrollments route
- moderation routes

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
npm run preview
```

### Run Test Suite

```bash
npm run test
```

Layer-specific runs:
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`

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

Current implementation is still the Vite SPA mock with in-memory state, but a Next.js route scaffold now exists under `app/` for migration work.

## Known Limitations

- No real authentication flow (demo role switcher only)
- Next.js API/DB layer is implemented but is not yet the default runtime path
- Route state is string-based and local (not URL-driven)
- Actions like enrollment, approval, notes, and discussion are UI-only placeholders
- `index.html` references `/index.css`, but no local `index.css` exists (Vite warns during build)
- Next.js scaffold files are present but Next.js runtime/dependencies are not wired as default scripts yet

## Recommended Next Implementation Steps

1. Introduce real routing (`react-router` or migrate to Next.js App Router).
2. Implement auth/session and server-side RBAC.
3. Move `MOCK_*` data to API + database (Prisma schema already drafted).
4. Convert tutor AI-generated drafts into persisted draft/publish workflow.
5. Add CI/CD checks (build + tests) before merge/deploy.

## Codex Handoff Files

For future agent sessions, see:
- `AGENTS.md` (project-specific Codex operating instructions)
- `docs/CODEX_CONTEXT.md` (deep technical context)
- `docs/DEPLOYMENT_PLAN_TODO.md` (execution tracker and next action)
- `docs/INFRA_DECISION.md` (final infrastructure choices for deployment)
- `docs/NEXTJS_ROUTE_MAP.md` (target route design and current mapping)
- `docs/LOCAL_SERVICE.md` (systemd service to keep local dev server running)
- `.agents/skills/linguistpro-maintainer/` (project-local reusable Codex skill)
