# LinguistPro Current-State -> Production-Ready Checklist

Last updated: 2026-04-27
Owner: Engineering Lead / Codex
Status baseline: Core app and backend scaffolding exist; production launch gates are partially automated.

## Execution Status Snapshot

- Done:
  - Finalize Production Infrastructure Topology (card implemented with topology + IaC/runbook docs)
  - Harden Environment and Secret Management (repo secret scan + rotation drill + stricter prod env validation)
  - Auth Security Hardening (email verification + password reset + lockout/rate limiting)
  - Student Onboarding Flow (Real Users) (profile + first enrollment + welcome flow)
  - Tutor Onboarding and Profile Governance (approval workflow + publish-path guardrails)
- Next:
  - RBAC and Permission Audit

## Definition of Production-Ready (v1)

- Platform can safely onboard real students and tutors.
- Payment and subscription flow is live with audit trail.
- Zoom live-class scheduling and attendance sync are operational.
- Critical flows are covered by monitoring, backup, alerting, QA, and support runbooks.

## Checklist

1. **Finalize Production Infrastructure Topology**
   - Decide final production deployment targets, DNS, TLS, CDN, and network boundaries.
   - Acceptance: environment diagram + approved IaC/runbook committed.

2. **Harden Environment and Secret Management**
   - Move all production secrets to managed secret store; enforce rotation policy.
   - Acceptance: no secrets in repo/local files for prod; rotation checklist tested.

3. **Auth Security Hardening**
   - Add email verification, password reset, brute-force/rate-limiting controls.
   - Acceptance: auth threat-model checklist passes and e2e auth tests pass.

4. **Student Onboarding Flow (Real Users)**
   - Complete registration, profile setup, welcome messaging, and first-course enrollment UX.
   - Acceptance: new student can register -> enroll -> access learning with no manual intervention.

5. **Tutor Onboarding and Profile Governance**
   - Add complete tutor onboarding, profile validation, and publishing controls.
   - Acceptance: admin can approve tutor and tutor can publish approved course path.

6. **RBAC and Permission Audit**
   - Verify every admin/tutor/student route and API for least privilege.
   - Acceptance: permission matrix documented + automated permission tests pass.

7. **Course Lifecycle Completion**
   - Enforce robust draft -> review -> publish -> archive lifecycle with audit fields.
   - Acceptance: all lifecycle transitions are validated and logged.

8. **Enrollment and Access Consistency**
   - Validate enrollment state against lesson/course access checks everywhere.
   - Acceptance: no unauthorized access; enrollment edge-case tests pass.

9. **Billing Provider Integration (Stripe or Equivalent)**
   - Implement checkout, webhook verification, payment status sync, failure handling.
   - Acceptance: test and live mode payment lifecycle works end-to-end.

10. **Subscription, Invoicing, and Receipt Flow**
    - Add plan management, invoice records, receipt delivery, renewal/cancel handling.
    - Acceptance: subscription events reconcile correctly in DB + user dashboard.

11. **Refund and Charge Dispute Workflow**
    - Define and implement admin workflows for refund and dispute operations.
    - Acceptance: documented process + admin UI/API flow tested.

12. **Zoom Integration Foundation**
    - Implement Zoom OAuth/app credentials, secure token storage/refresh.
    - Acceptance: platform can create authenticated Zoom resources without manual token handling.

13. **Live Class Scheduling via Zoom**
    - Create tutor-driven session scheduling and student join link delivery.
    - Acceptance: tutor schedules class, students receive valid join links, session metadata persisted.

14. **Attendance and Recording Sync (Zoom)**
    - Sync attendance and recording metadata back to platform.
    - Acceptance: session attendance appears in dashboard/admin reporting.

15. **Transactional Communications**
    - Add email workflows: welcome, enrollment, payment receipt, class reminder, cancellation.
    - Acceptance: message templates + delivery retries + failure observability are in place.

16. **Admin KPI and Operational Dashboard**
    - Replace placeholders with production KPIs (MRR, enrollments, conversion, churn, support load).
    - Acceptance: dashboards query real production data and align with BI definitions.

17. **Content Moderation and Abuse Reporting**
    - Add reporting/moderation queue for user-generated content and interactions.
    - Acceptance: report -> triage -> action flow audited and tested.

18. **Security Controls and Compliance Baseline**
    - Add WAF/rate limits, CSP and secure headers, dependency checks, audit logging.
    - Acceptance: security checklist pass + recurring scans integrated in CI.

19. **Backup, Restore, and Disaster Recovery Drill**
    - Formalize backup cadence and run restore drills with measured RPO/RTO.
    - Acceptance: restore drill evidence for latest window is archived.

20. **Observability and Alerting**
    - Add log aggregation, metrics dashboards, SLO alerts, on-call escalation paths.
    - Acceptance: synthetic checks + alert routes verified.

21. **Performance and Capacity Validation**
    - Run load tests for course browse, checkout, enroll, and lesson access paths.
    - Acceptance: target latency/error thresholds met at expected peak load.

22. **QA Automation Expansion and Regression Gates**
    - Expand integration/e2e coverage for payments, zoom, onboarding, and admin ops.
    - Acceptance: CI gates block merges on critical regression failures.

23. **Staging UAT and Business Sign-Off**
    - Execute staging smoke + role-flow + billing + zoom scripts with approvals.
    - Acceptance: signed checklist with stakeholder approvals.

24. **Legal, Policy, and User-Facing Trust Artifacts**
    - Publish Terms, Privacy, Refund policy, and incident/support contact pathways.
    - Acceptance: policy pages live and linked in onboarding/checkout.

25. **Support and Incident Runbook Readiness**
    - Define incident severity matrix, response SLA, and support triage workflow.
    - Acceptance: support dry-run performed and documented.

26. **Production Cutover and Launch Readiness Review**
    - Execute final preflight, change freeze, launch checklist, and rollback simulation.
    - Acceptance: launch review sign-off complete.

27. **Post-Launch Stabilization Window Plan**
    - Define first 14-day monitoring cadence and hotfix protocol.
    - Acceptance: daily review ritual and owners assigned.
