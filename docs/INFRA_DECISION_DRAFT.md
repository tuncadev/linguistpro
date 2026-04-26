# Infrastructure Decision Draft

Last updated: 2026-04-26
Status: In progress (next execution step)

This draft continues the next item from `docs/DEPLOYMENT_PLAN_TODO.md`.

## Recommended Baseline Stack

1. App hosting: Vercel (Next.js native deployment workflow).
2. Database: managed PostgreSQL (Neon or Supabase Postgres).
3. Object storage: Cloudflare R2 or AWS S3 (course assets/resources).
4. CDN and edge: Vercel Edge + provider CDN defaults.
5. Secrets: Vercel project environment variables + provider secret management.
6. Error tracking: Sentry.
7. Logs/metrics: Vercel analytics + structured server logs to Axiom/Datadog.

## Why this baseline

1. Fastest route to production for Next.js.
2. Low operations overhead for a small-to-medium v1 team.
3. Clear upgrade path when scale/traffic grows.

## Pending Decisions (Need owner confirmation)

1. Preferred cloud vendor policy:
   - fastest launch (mixed managed services)
   - single-cloud standardization
2. Data residency/compliance requirements.
3. Expected traffic profile for first 90 days.
4. Budget ceiling for monthly infra.
5. Backup retention policy and RTO/RPO targets.

## Decision Gate

After confirming pending decisions, update:
1. `docs/DEPLOYMENT_PLAN_TODO.md` -> mark cloud-provider selection complete.
2. `docs/INFRA_DECISION_DRAFT.md` -> promote to final `docs/INFRA_DECISION.md`.
