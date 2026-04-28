# RBAC and Permission Matrix

Last updated: 2026-04-28
Owner: Engineering

This document is the source of truth for route and API access expectations used by the automated permission audit tests.

## App Route Matrix

| Path pattern | Guest | Student | Tutor | Admin | Enforcement |
| --- | --- | --- | --- | --- | --- |
| `/admin/**` | deny | deny | deny | allow | `middleware.ts` + `canAccessPath` |
| `/tutor/**` | deny | deny | allow | allow | `middleware.ts` + `canAccessPath` |
| `/student/**` | deny | allow | allow | allow | `middleware.ts` + `canAccessPath` |
| `/login`, `/register`, `/` and public pages | allow | allow | allow | allow | public routes |

## API Route Matrix (Protected)

| API route | Method(s) | Allowed role(s) | Enforcement point |
| --- | --- | --- | --- |
| `/api/admin/**` | all | `ADMIN` | `requireRoles(req, ["ADMIN"])` |
| `/api/tutor/onboarding` | `GET`, `POST` | `TUTOR`, `ADMIN` | `requireRoles(req, ["TUTOR", "ADMIN"])` |
| `/api/student/onboarding` | `GET`, `POST` | `STUDENT`, `ADMIN` | `requireRoles(req, ["STUDENT", "ADMIN"])` |
| `/api/student/welcome` | `GET` | `STUDENT`, `ADMIN` | `requireRoles(req, ["STUDENT", "ADMIN"])` |
| `/api/courses` (write path) | `POST` | `TUTOR`, `ADMIN` | `requireRoles(req, ["TUTOR", "ADMIN"])` |
| `/api/courses/[id]` (write path) | `PATCH`, `DELETE` | `TUTOR`, `ADMIN` | `requireRoles(req, ["TUTOR", "ADMIN"])` |
| `/api/courses/[id]/submit` | `POST` | `TUTOR`, `ADMIN` | `requireRoles(req, ["TUTOR", "ADMIN"])` |
| `/api/ai/course-draft` | `POST` | `TUTOR`, `ADMIN` | `requireRoles(req, ["TUTOR", "ADMIN"])` |
| `/api/enroll` | `GET` | `STUDENT`, `TUTOR`, `ADMIN` | `requireRoles(req, ["STUDENT", "TUTOR", "ADMIN"])` |
| `/api/enroll` | `POST` | `STUDENT`, `ADMIN` | `requireRoles(req, ["STUDENT", "ADMIN"])` |
| `/api/learning/access` | `GET` | `STUDENT`, `TUTOR`, `ADMIN` | `requireRoles(req, ["STUDENT", "TUTOR", "ADMIN"])` |
| `/api/metrics` | `GET` | `ADMIN` | `requireRoles(req, ["ADMIN"])` |
| `/api/webhooks` | `GET` | `ADMIN` | `requireRoles(req, ["ADMIN"])` |

## Notes

- Public course reads remain intentionally open (`/api/courses`, `/api/courses/[id]` GET with visibility constraints).
- Additional business rules (ownership, tutor approval, publish constraints) are enforced after RBAC role checks.
- Regression protection is implemented in `tests/unit/rbac-permissions.unit.test.ts`.
