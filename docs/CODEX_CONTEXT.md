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
3. Service (`services/geminiService.ts`) requests structured JSON from Gemini.
4. Result is transformed into local `Course` object and prepended to state.

Important details:
- model name is `gemini-3-flash-preview`
- service reads `process.env.API_KEY`
- failures are logged and return `null`
- generated syllabus strings are mapped to sections with empty lesson lists

## 8) Environment and Build Notes

Environment variable:
- `.env.local`: `GEMINI_API_KEY=...`

Vite maps this into:
- `process.env.API_KEY`
- `process.env.GEMINI_API_KEY`

Expected commands:
- `npm install`
- `npm run dev`
- `npm run build`

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
- Default runnable app remains the Vite implementation until Next.js scripts/deps are promoted.

## 10) Known Gaps and Risks

- No backend persistence
- No API endpoints
- No real authentication/session
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
3. Add component tests for key view transitions.
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
