# QA Regression Gates

Last verified: 2026-04-28

## Mandatory CI Gates

1. `npm run test`
2. `npm run build`
3. `npm run ops:validate-env`

## Mandatory UAT Gates (pre-release)

1. `npm run ops:uat:smoke`
2. `npm run ops:uat:roles`
3. `npm run ops:uat:tutors`
4. `npm run ops:uat:runtime`

## Critical Flow Coverage

1. Authentication/session flows
2. Role-based access and moderation
3. Enrollment and lesson access guardrails
4. Zoom integration token/webhook handling
5. Tutor/course integrity diagnostics

## Merge/Release Rule

If any critical gate fails, release is blocked until:

1. root cause is documented,
2. fix is validated by rerun,
3. evidence report is attached in release notes.
