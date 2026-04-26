# Deploy and Rollback Runbook

Last updated: 2026-04-26

This runbook defines the deployment and rollback process for LinguistPro.

## Scope

- App hosting target: Vercel
- Database: Neon PostgreSQL
- Migration engine: Prisma

## Pre-Deploy Requirements

1. Latest branch is merged and CI is green.
2. `docs/STAGING_UAT_SIGNOFF.md` is completed for the release candidate.
3. Backups are current (`npm run db:backup`).
4. Env/secrets policy check passes (`npm run ops:validate-env`).

## Preflight Command

Run local preflight:

```bash
npm run ops:deploy:preflight
```

Optional with production-like env file:

```bash
ENV_FILE=.env.production npm run ops:deploy:preflight
```

Local dry-run example (when reusing `.env.local` for validation):

```bash
NODE_ENV=production ENV_FILE=.env.local npm run ops:deploy:preflight
```

## Staging Deploy Procedure

1. Deploy release candidate to staging environment.
2. Apply migrations: `npx prisma migrate deploy`.
3. Run smoke checks:
   - `STAGING_BASE_URL=<staging-url> npm run ops:uat:smoke`
4. Execute manual UAT checklist and capture sign-off.

## Production Deploy Procedure

1. Confirm staging sign-off with no blocker issues.
2. Ensure production backup exists in the last 24h.
3. Run launch checklist gate:
   - `STAGING_UAT_SIGNED_OFF=true CI_GREEN=true ENV_FILE=.env.production PRODUCTION_BASE_URL=<prod-url> npm run ops:deploy:launch`
4. Confirm launch checklist report under `ops/deploy/reports/` is passing.
5. Deploy app artifact to production.
6. Apply migrations with `npx prisma migrate deploy`.
7. Run production smoke checks:
   - homepage and key routes
   - auth flow
   - tutor draft generation endpoint
   - admin moderation queue load
8. Monitor logs/errors for at least 30 minutes after deploy.

## Launch Checklist Dry-Run

Use this when validating process wiring without running external checks:

```bash
DRY_RUN=1 STAGING_UAT_SIGNED_OFF=true CI_GREEN=true npm run ops:deploy:launch
```

This writes a report to `ops/deploy/reports/` and exits non-zero on checklist failures.

## Rollback Procedure

App rollback:

1. Revert traffic to previous stable deployment in hosting platform.
2. Re-run smoke checks against rolled-back version.

Database rollback:

1. If migration is non-breaking, prefer forward-fix migration.
2. If rollback is required, restore last known-good backup to recovery target.
3. Validate critical tables (`User`, `Course`, `Enrollment`) and data integrity.

## Post-Rollback Checks

1. Confirm error rate returns to baseline.
2. Confirm new enrollments and tutor/admin actions function correctly.
3. Record incident timeline and root cause.

## Deployment Log Template

| Date (UTC) | Version/Commit | Environment | Operator | Result | Notes |
|---|---|---|---|---|---|
| _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
