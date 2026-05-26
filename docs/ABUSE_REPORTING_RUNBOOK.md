# Abuse Reporting and Moderation Runbook

Last verified: 2026-04-28

## Flow

1. Authenticated user submits report via `POST /api/abuse-reports`.
2. User can track own reports via `GET /api/abuse-reports`.
3. Admin triages queue via `GET /api/admin/abuse-reports`.
4. Admin updates decision via `PATCH /api/admin/abuse-reports/:id`.

## Data Model

- `AbuseReport`
  - reporter identity
  - target type/id
  - reason/details
  - moderation status and notes
  - review metadata (`reviewedById`, `reviewedAt`)

## Statuses

1. `OPEN`
2. `UNDER_REVIEW`
3. `ACTIONED`
4. `REJECTED`

## QA Checklist

1. Reporter submits a report and receives `201`.
2. Reporter can list own report history.
3. Admin can see report in moderation queue.
4. Admin status update is persisted and visible in subsequent list calls.
