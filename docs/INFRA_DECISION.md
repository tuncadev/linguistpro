# Infrastructure Decision (Final)

Last updated: 2026-04-26
Status: Finalized for Sprint 0 execution
Decision scope: P0 item "Choose cloud providers (app, DB, object storage, CDN, secrets, observability)"

## Decision Summary

1. Hosting platform: Vercel
2. Database: Neon PostgreSQL (managed Postgres)
3. Object storage: Cloudflare R2
4. CDN/edge: Vercel Edge + built-in global CDN
5. Secrets management: Vercel environment variables + scoped project/env separation
6. Error tracking: Sentry
7. Logs/metrics: Vercel native analytics + Axiom for structured app logs

## Why This Stack

1. Fastest path for a Next.js App Router production rollout.
2. Low ops overhead for v1 launch.
3. Cost-efficient early scale with clear migration options.
4. Strong developer ergonomics for CI/CD and preview environments.

## Environment Topology

1. `development`: local + preview deployments
2. `staging`: protected pre-production environment with production-like config
3. `production`: public live environment

Each environment has isolated variables and separate DB branches/instances where applicable.

## Operational Defaults

1. Migration strategy: Prisma migrations via CI/CD deploy job.
2. Database backups: managed provider backups enabled daily.
3. Initial RPO target: <= 24 hours.
4. Initial RTO target: <= 4 hours.
5. Incident alerting: Sentry alerts + uptime checks routed to primary channel.

## Security Baseline

1. No LLM keys in client-side bundles.
2. All Gemini calls run server-side only.
3. Principle of least privilege for DB and service tokens.
4. Separate service keys per environment.
5. Security headers and rate limiting enabled at app/API layer.

## Cost Guardrails (Initial)

1. Start on managed starter/team tiers.
2. Enable monthly cost alerts in each provider.
3. Review cost profile weekly during first month post-launch.

## Revisit Triggers

Re-evaluate this decision when any condition is true:
1. Sustained traffic exceeds starter/team thresholds.
2. Compliance requirements mandate single-cloud or region lock.
3. Data egress/object storage patterns significantly increase costs.
4. Observability needs exceed current log retention/search limits.

