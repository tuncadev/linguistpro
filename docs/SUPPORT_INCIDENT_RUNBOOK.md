# Support and Incident Runbook

Last verified: 2026-04-28

## Severity Matrix

1. `SEV-1`: complete outage or data/security incident affecting core flows.
2. `SEV-2`: major degradation affecting enrollment, login, or live classes.
3. `SEV-3`: partial degradation/workaround available.
4. `SEV-4`: minor bug/documentation issue.

## Response SLA

1. `SEV-1`: acknowledge within 15 minutes, mitigation within 60 minutes.
2. `SEV-2`: acknowledge within 30 minutes, mitigation within 4 hours.
3. `SEV-3`: acknowledge within 4 hours, fix within 2 business days.
4. `SEV-4`: acknowledge within 1 business day, scheduled in normal sprint.

## Triage Workflow

1. Capture report details:
   - user role/account
   - affected endpoint/page
   - timestamp/timezone
   - screenshot/log/request id
2. Classify severity.
3. Assign owner:
   - app/runtime issue -> engineering
   - policy/refund/legal -> operations
   - account access/support -> support
4. Track status updates every SLA interval.
5. Close with root cause and preventive action.

## Dry-Run Evidence

Reference report:

- `ops/uat/reports/support-dry-run-20260428T115217Z.md`
