# LinguistPro Maintainer Checklist

## Quick Audit

- Read `AGENTS.md`
- Read `README.md`
- Read `docs/CODEX_CONTEXT.md`
- Read `docs/DEPLOYMENT_PLAN_TODO.md`
- Read `docs/INFRA_DECISION.md`
- Read `docs/NEXTJS_ROUTE_MAP.md`
- Read `prisma/schema.prisma`
- Read `lib/auth/session.ts`
- Read `lib/auth/server-checks.ts`
- Read `lib/ai/course-draft.ts`
- Read `app/api/courses/route.ts`
- Inspect `App.tsx`, `types.ts`, `constants.ts`

## Build Verification

- Run `npm run build` before edits if possible
- Run `npm run build` after edits

## High-Risk Touchpoints

- `App.tsx` context shape changes
- `view` transition logic changes
- `Course` field compatibility across views
- `services/geminiService.ts` response parsing contract

## Must-Update Docs When Behavior Changes

- `README.md`
- `docs/CODEX_CONTEXT.md`
- `docs/DEPLOYMENT_PLAN_TODO.md`
- `AGENTS.md`

## Planned vs Implemented Reminder

- Implemented: Vite SPA mock
- Planned only: Next.js + Prisma + middleware RBAC (`*.txt` planning docs)
