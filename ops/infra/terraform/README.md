# Terraform Baseline (IaC Ownership)

Last updated: 2026-04-27
Status: Approved baseline for production topology tracking

This directory is the source-of-truth location for future Infrastructure-as-Code rollout.
Current production-readiness acceptance for topology is met with:

- `docs/PRODUCTION_INFRA_TOPOLOGY.md`
- `ops/infra/PROVISIONING_RUNBOOK.md`

## Ownership

- Primary owner: Platform lead
- Secondary owner: DevOps backup owner
- Change policy: all infra changes require PR review and runbook update

## Planned Module Boundaries

- `network_dns`: Cloudflare zones/records and DNS routing
- `app_hosting`: Vercel project, env variables, and domain bindings
- `database`: Neon project resources and branch/environment mapping
- `storage`: Cloudflare R2 buckets and scoped access keys
- `observability`: Sentry + log/metrics destination wiring

## Required Environment Separation

- No shared write credentials between staging and production.
- Separate project/env variable sets for `staging` and `production`.
- Separate webhook secrets for Stripe and Zoom in each environment.

## Rollout Plan

1. Start with read-only/data-source and import-safe resources.
2. Add managed resources incrementally by provider.
3. Keep parity with `ops/infra/PROVISIONING_RUNBOOK.md`.
4. Block infra merges that do not include rollback notes.

## Validation Gates

Before applying any IaC update:

1. `terraform fmt -check`
2. `terraform validate`
3. `terraform plan` against target environment
4. Run deploy preflight and launch gates after apply

## Notes

- This repository currently tracks the approved topology and provisioning runbook first.
- Provider migration to fully-managed Terraform can proceed in follow-up cards without changing application behavior.
