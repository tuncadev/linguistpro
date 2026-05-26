# Security Controls Baseline

Last verified: 2026-04-28

## Implemented Controls

1. Route protection and RBAC checks:
   - `middleware.ts`
   - `lib/auth/server-checks.ts`
2. Auth hardening:
   - tokenized email verification and password reset
   - failed-login lockout and rate limiting
3. Response security headers on app routes:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy`
   - `Content-Security-Policy`
4. Secrets scanning and validation:
   - `npm run ops:secrets:scan`
   - `npm run ops:validate-env`
5. CI regression gates:
   - `.github/workflows/ci.yml`

## Verification Commands

```bash
npm run ops:secrets:scan
npm run ops:validate-env
bash ops/security/security-smoke.sh
```

The security smoke script produces report evidence under:

- `ops/secrets/reports/security-smoke-*.md`

## External Controls (Infrastructure-Owned)

The following controls are intentionally configured at infrastructure layer and must be validated outside this repository:

1. WAF rules and bot controls.
2. DDoS protections/CDN edge policies.
3. Provider-managed vulnerability scanning.
4. Security alert routing to incident channels.
