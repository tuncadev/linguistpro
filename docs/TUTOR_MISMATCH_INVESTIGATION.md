# Tutor Count Mismatch Investigation

Last verified: 2026-04-28

## Symptom

- `/admin/tutors` shows many tutors (example: 9).
- Course detail pages show only a small subset of tutors (example: Prof. Elena Rodrigues and Governance Tutor).

## Confirmed Technical Facts (this repo)

1. Tutor profile rendered on course pages is based on `course.tutorId` from backend data.
2. Admin tutors page loads `GET /api/admin/tutors` and is role-filtered to `User.role = TUTOR`.
3. In this repo's local DB at verification time, only 2 tutors existed and course assignments used only those 2 tutor IDs.
4. Active systemd frontend service on host was configured to another project path:
   - service: `catalina-next.service`
   - working directory: `/home/pardus/Hosting/catalina-academy/frontend`

This makes runtime/data-source divergence the primary root-cause candidate when observed UI data does not match this repository's DB.

## Fast Diagnostics

### 1) DB integrity in this repo

Run:

```bash
npm run ops:uat:tutors
```

This outputs:
- total tutors
- total/published courses
- distinct tutor IDs used by courses
- orphaned tutor references
- per-tutor course assignment counts

### 2) Runtime service source check

Run:

```bash
npm run ops:uat:runtime
```

This verifies:
- target user service is active (default: `linguistpro-dev.service`)
- service `WorkingDirectory` matches this repository
- `/api/tutors` count matches DB `User(role=TUTOR)` count

If this fails, UI data may come from a different app/env/DB.

### 3) App env source check

Verify runtime `DATABASE_URL` is the same one expected for this project and environment.

## Remediation Plan

1. Align service runtime to this repository for the target domain/environment.
2. Ensure runtime env file and `DATABASE_URL` are consistent with the intended DB.
3. Run `npm run ops:uat:tutors` after deployment.
4. If mismatch persists:
   - backfill tutor-course assignments,
   - add integrity guardrails in course/tutor mutation paths,
   - re-run UAT checks for `/admin/tutors` and course pages.
