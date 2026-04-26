# LinguistPro

LinguistPro is a React + Vite language-learning platform prototype with role-based dashboards for `STUDENT`, `TUTOR`, and `ADMIN`, plus Gemini-powered course draft generation for tutors.

This project currently behaves as a frontend-first simulation:
- no backend API is wired
- no persistent database is wired
- auth and role switching are demo-mode via in-memory mock users

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
1. Uses `GoogleGenAI` with `process.env.API_KEY`.
2. Sends a prompt to model `gemini-3-flash-preview`.
3. Requests strict JSON response schema:
- `title: string`
- `description: string`
- `syllabus: string[]`
- `price: number`
4. Parses `response.text` into JSON and returns it.

In tutor dashboard (`views/TutorDashboard.tsx`):
- Result is converted into a local `Course` object.
- Missing optional backend data is mocked (`rating`, `reviews`, empty lesson arrays per syllabus section).
- New course is prepended to in-memory state only.

## Environment Variables

Create/update `.env.local`:

```env
GEMINI_API_KEY=your_real_key_here
```

Vite exposes this key through `vite.config.ts`:
- `process.env.API_KEY`
- `process.env.GEMINI_API_KEY`

If no valid key is set, AI generation fails gracefully and returns `null`.

Authentication/session env:
- `AUTH_SESSION_SECRET` must be set for signed session cookies.

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
- No API/backend persistence
- No DB integration despite Prisma design notes
- Route state is string-based and local (not URL-driven)
- Actions like enrollment, approval, notes, and discussion are UI-only placeholders
- `index.html` references `/index.css`, but no local `index.css` exists (Vite warns during build)
- Next.js scaffold files are present but Next.js runtime/dependencies are not wired as default scripts yet

## Recommended Next Implementation Steps

1. Introduce real routing (`react-router` or migrate to Next.js App Router).
2. Implement auth/session and server-side RBAC.
3. Move `MOCK_*` data to API + database (Prisma schema already drafted).
4. Convert tutor AI-generated drafts into persisted draft/publish workflow.
5. Add tests for critical flows (catalog filtering, view transitions, tutor AI result mapping).

## Codex Handoff Files

For future agent sessions, see:
- `AGENTS.md` (project-specific Codex operating instructions)
- `docs/CODEX_CONTEXT.md` (deep technical context)
- `docs/DEPLOYMENT_PLAN_TODO.md` (execution tracker and next action)
- `docs/INFRA_DECISION.md` (final infrastructure choices for deployment)
- `docs/NEXTJS_ROUTE_MAP.md` (target route design and current mapping)
- `.agents/skills/linguistpro-maintainer/` (project-local reusable Codex skill)
