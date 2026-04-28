# Tutor Backfill Runbook

Last verified: 2026-04-28

## Purpose

Normalize tutor-course assignment integrity when data drift occurred:
- courses reference non-tutor users or missing tutor IDs
- no tutors exist in database but courses exist
- `coursesAuthored` should be refreshed from actual assignments

## Script

- Script path: `ops/data/backfill-tutor-assignments.mjs`
- Package command: `npm run ops:data:backfill:tutors`

## Modes

1. Dry-run (no writes):

```bash
npm run ops:data:backfill:tutors
```

2. Apply mode (writes to DB):

```bash
npm run ops:data:backfill:tutors -- --apply
```

## What It Does

1. Loads `DATABASE_URL` from `.env.local` if not already exported.
2. Ensures a fallback tutor exists:
   - dry-run: reports a virtual fallback tutor id
   - apply: creates a real fallback tutor if none exists
3. Finds courses whose `tutorId` is not a current `role=TUTOR` user.
4. Reassigns orphaned course `tutorId` values to fallback tutor in apply mode.
5. Recomputes and writes `User.coursesAuthored` from real course counts in apply mode.

## QA After Apply

Run:

```bash
npm run ops:uat:tutors
npm run ops:uat:runtime
```

Both checks should pass before closing the task.

## Rollback Notes

1. Restore a recent DB backup if reassignment was incorrect.
2. Or manually reassign course tutors through admin course edit flows.
3. Re-run `npm run ops:uat:tutors` to verify repaired state.
