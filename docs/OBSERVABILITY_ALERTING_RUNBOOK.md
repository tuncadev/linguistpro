# Observability and Alerting Runbook

Last verified: 2026-04-28

## Scope

This runbook covers baseline service observability and synthetic checks for LinguistPro.

Implemented telemetry modules:

1. `lib/observability/logger.ts`
2. `lib/observability/metrics.ts`
3. `lib/observability/error-tracker.ts`

Endpoints:

1. `GET /api/health`
2. `GET /api/metrics` (admin-protected)

## Synthetic Check

Run:

```bash
bash ops/observability/synthetic-check.sh
```

Report output:

- `ops/uat/reports/synthetic-check-*.md`

## Alert Routing Contract

1. 5xx API failures:
   - sent to `OBSERVABILITY_ERROR_WEBHOOK_URL` when configured.
2. Health check failures:
   - synthetic check failure should page on-call channel.
3. Metrics endpoint failures:
   - trigger platform alert and investigate auth/runtime path.

## On-Call Response

1. Confirm current incident severity.
2. Inspect latest structured API logs for request IDs.
3. Check health endpoint and deployment status.
4. Evaluate rollback using `docs/DEPLOY_ROLLBACK_RUNBOOK.md` if service degradation continues.
5. Record timeline and postmortem actions.
