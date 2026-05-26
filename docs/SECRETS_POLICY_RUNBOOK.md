# Production Env and Secrets Policy

Last updated: 2026-04-26

This document defines how production secrets are managed, rotated, and validated for LinguistPro.

## Policy

- Never commit production secrets to git.
- Use managed secret storage (for example: Vercel/Cloudflare/Render secrets + Neon credentials).
- Keep `.env.example` as placeholders only.
- Do not keep production secrets in local project files such as `.env`, `.env.local`, or `.env.production`.
- Grant least-privilege access to secret managers.
- Every rotation must be documented with date, owner, and verification result.

## Required Production Variables

- `NODE_ENV=production`
- `AUTH_SESSION_SECRET` (>= 32 chars, random)
- `DATABASE_URL` (`postgresql://...`)
- `GEMINI_API_KEY`
- `AUTH_ALLOW_DEV_ROLE_HEADER=false`
- `OBSERVABILITY_ERROR_WEBHOOK_URL` (optional but recommended)

## Rotation Cadence

- Standard rotation: every 90 days.
- Emergency rotation: immediately after suspected exposure.
- Triggered rotation: after team-member offboarding for secret-admin roles.

## Rotation Procedure

1. Generate new values in secret manager.
2. Deploy to staging and run smoke checks.
3. Promote updated secrets to production.
4. Run environment validation and health checks.
5. Confirm no auth/session/API regressions.
6. Revoke old secret versions where supported.

## Validation Command

Validate current environment before production deploy:

```bash
npm run ops:validate-env
```

Validate from a specific env file:

```bash
ENV_FILE=.env.production npm run ops:validate-env
```

Scan tracked repository files for committed secrets:

```bash
npm run ops:secrets:scan
```

Run a rotation drill (old vs new env values) and generate evidence report:

```bash
OLD_ENV_FILE=/path/old.env NEW_ENV_FILE=/path/new.env npm run ops:secrets:rotation:drill
```

The rotation drill report is generated under `ops/secrets/reports/`.

## Incident Response

If secret leakage is suspected:

1. Rotate compromised secret immediately.
2. Revoke old tokens/keys.
3. Review logs for suspicious access.
4. Record timeline and remediation in incident notes.
5. Schedule post-incident hardening tasks.
