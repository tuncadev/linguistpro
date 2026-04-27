# Production Provisioning Runbook

Last updated: 2026-04-27
Owner: Platform
Scope: Staging + Production environment provisioning for LinguistPro

## Purpose

Provision and validate all production infrastructure dependencies before live onboarding of tutors and students.

## Inputs

- Topology: `docs/PRODUCTION_INFRA_TOPOLOGY.md`
- Provider decisions: `docs/INFRA_DECISION.md`
- Secrets policy: `docs/SECRETS_POLICY_RUNBOOK.md`
- Deploy gates: `ops/deploy/preflight.sh`, `ops/deploy/launch-checklist.sh`

## Step 1: Prepare Provider Accounts

1. Confirm access for Vercel, Neon, Cloudflare, Sentry, and Axiom.
2. Ensure production owners and backup owners are assigned.
3. Enable billing alerts in each provider.

Exit criteria:
- All providers are accessible by primary and backup platform owners.

## Step 2: Provision App Environments (Vercel)

1. Create or confirm project environments: `development`, `preview/staging`, `production`.
2. Configure environment variables from secure source, not from repo files.
3. Set protected environment rules for production deploys.

Exit criteria:
- `staging` and `production` deployments both succeed with environment-specific secrets.

## Step 3: Provision Data Layer (Neon)

1. Create dedicated production database/branch and separate staging database/branch.
2. Create least-privilege application users for each environment.
3. Configure backup retention policy and restore permissions.

Exit criteria:
- DB connectivity validated for both staging and production.
- Backup policy is active and documented.

## Step 4: Provision Object Storage (R2)

1. Create environment-isolated buckets (`linguistpro-staging`, `linguistpro-production`).
2. Create scoped access keys per environment.
3. Validate upload/read/delete via server-side test route or script.

Exit criteria:
- Server-side storage operations pass in both environments.

## Step 5: Configure DNS and TLS

1. Point staging and production hostnames to Vercel targets.
2. Verify TLS issuance and certificate validity.
3. Validate webhook callback endpoints are publicly reachable over HTTPS.

Exit criteria:
- HTTPS checks pass for app and webhook endpoints.

## Step 6: Configure Observability and Alerting

1. Connect Sentry DSNs per environment.
2. Configure Axiom and Vercel analytics datasets.
3. Configure alert routes for uptime and error thresholds.

Exit criteria:
- Synthetic error and uptime checks trigger expected alerts.

## Step 7: Configure Payments and Zoom App Credentials

1. Add Stripe keys and webhook secret per environment.
2. Add Zoom app credentials and webhook verification secret per environment.
3. Run webhook signature validation checks in staging.

Exit criteria:
- Stripe and Zoom webhook verification succeeds in staging.

## Step 8: Preflight and Launch Gates

1. Run production-style preflight:
   - `NODE_ENV=production ENV_FILE=.env.local npm run ops:deploy:preflight`
2. Run launch gate:
   - `npm run ops:deploy:launch`

Exit criteria:
- Both scripts complete successfully with no blocking failures.

## Rollback Procedure

If production cutover fails:
1. Revert app deploy to last known-good release in Vercel.
2. Pause non-essential webhook handlers if needed.
3. Follow `docs/DEPLOY_ROLLBACK_RUNBOOK.md`.

## Evidence to Archive

- Provider configuration screenshots/links
- Preflight and launch reports
- Backup and restore test report
- Webhook validation logs for Stripe and Zoom
