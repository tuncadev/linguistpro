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
8. `App.tsx`
9. `types.ts`
10. `constants.ts`

## Step 2: Confirm baseline

Run:
- `npm run build`

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

Then summarize:
- what changed
- why it changed
- what was verified
- any remaining risks

## References

Use `references/checklist.md` for a compact operational checklist.
