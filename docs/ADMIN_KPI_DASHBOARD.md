# Admin KPI and Operational Dashboard

Last updated: 2026-04-28

## Scope

Expands admin overview to read KPI metrics from live DB data.

## Backend Source

- API: `GET /api/admin/dashboard/overview`
- Route: `app/api/admin/dashboard/overview/route.ts`

## KPI Coverage

- Revenue proxy:
  - `mrrProxy30d` (sum of enrollment-linked course prices in last 30 days)
- User funnel:
  - onboarding completion rate
  - tutor approval rate + pending tutor approvals
- Course moderation:
  - pending course submissions
- Live classes:
  - upcoming/completed/cancelled counts
  - attendance participant totals and average joins
  - recording assets count
- Communications:
  - sent/failed/pending totals
  - 7-day sent/failed counts
  - 7-day success rate

## Frontend Wiring

- Service contract: `services/adminDashboardApiService.ts`
- View rendering: `views/AdminDashboard.tsx`
- KPI cards are rendered from API payload with fallback-safe formatting.
