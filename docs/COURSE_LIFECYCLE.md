# Course Lifecycle

Last updated: 2026-04-28

## Canonical statuses

1. `DRAFT`
2. `PENDING_REVIEW`
3. `PUBLISHED`
4. `ARCHIVED`

## Allowed transitions

| From | To | Allowed actor(s) |
| --- | --- | --- |
| `DRAFT` | `PENDING_REVIEW` | `TUTOR`, `ADMIN` |
| `DRAFT` | `PUBLISHED` | `ADMIN` |
| `DRAFT` | `ARCHIVED` | `ADMIN` |
| `PENDING_REVIEW` | `PUBLISHED` | `ADMIN` |
| `PENDING_REVIEW` | `DRAFT` | `ADMIN` |
| `PENDING_REVIEW` | `ARCHIVED` | `ADMIN` |
| `PUBLISHED` | `ARCHIVED` | `ADMIN` |
| `ARCHIVED` | `DRAFT` | `ADMIN` |

Any other transition is rejected with conflict response.

## Audit logging

Every status transition writes a row in `CourseLifecycleEvent` with:

- `courseId`
- `fromStatus`
- `toStatus`
- `actorId`
- `actorRole`
- `reason`
- `metadata`
- `createdAt`

Additional snapshot fields on `Course`:

- `submittedAt`
- `reviewedAt`
- `archivedAt`
- `statusReason`
- `statusChangedById`
- `statusChangedAt`

## API paths that emit lifecycle events

- `POST /api/courses` (initial course status event)
- `POST /api/courses/[id]/submit`
- `POST /api/admin/courses/[id]/moderate`
- `PATCH /api/courses/[id]` (status change only)
