# LinguistPro Agent Instructions

These instructions are project-local and apply to future Codex sessions in this repository.

## Project Identity

- Project type: frontend prototype
- Runtime: Vite + React + TypeScript
- Primary goal: demonstrate language-course platform UX and role-based flows
- Current data source: in-memory mock data in `constants.ts`
- AI integration: Gemini draft course generation for tutor dashboard

## First-Read Files

Before making edits, read in this order:
1. `README.md`
2. `docs/CODEX_CONTEXT.md`
3. `docs/DEPLOYMENT_PLAN_TODO.md`
4. `App.tsx`
5. `types.ts`
6. `constants.ts`

## Canonical Commands

- Install: `npm install`
- Dev server: `npm run dev`
- Production build check: `npm run build`
- Local preview: `npm run preview`

## Architecture Reality Check

- This is not a Next.js app yet.
- Files `prisma-schema.txt`, `folder-structure.txt`, and `rbac-strategy.txt` are planning artifacts.
- Navigation is app-state based (`view` string in `App.tsx`), not URL-route based.

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
- API key is read from `process.env.API_KEY` (mapped from `GEMINI_API_KEY` in Vite config).
- Keep response schema strict JSON for reliable parsing.
- On failure, current behavior returns `null`; preserve or intentionally improve this contract.

## Safe Change Strategy

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
