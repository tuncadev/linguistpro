# Zoom Live Class Scheduling

Last updated: 2026-04-28

## Scope

This module adds tutor-driven Zoom class scheduling and student join-link delivery with persisted metadata.

## Data Model

`LiveClassSession` stores:

- course/tutor linkage (`courseId`, `tutorId`)
- schedule metadata (`title`, `agenda`, `startsAt`, `durationMinutes`, `timezone`, `status`)
- Zoom metadata (`zoomMeetingId`, `zoomJoinUrl`, `zoomStartUrl`, `zoomPassword`, `zoomHostEmail`)
- lifecycle metadata (`cancelledAt`, `cancelledById`, timestamps)

## APIs

- `GET /api/live-classes` (`STUDENT`, `TUTOR`, `ADMIN`)
  - `STUDENT`: sessions for enrolled courses
  - `TUTOR`: sessions they own
  - `ADMIN`: all sessions
- `POST /api/live-classes` (`TUTOR`, `ADMIN`)
  - Creates Zoom meeting and persists session metadata
  - Guardrails:
    - course must exist
    - tutor can schedule only own course
    - course must be `PUBLISHED`
- `GET /api/live-classes/:id/join` (`STUDENT`, `TUTOR`, `ADMIN`)
  - returns join URL and meeting metadata
  - student requires active enrollment in session course

## Integration Contract

- Scheduling uses `createZoomMeeting(...)` from `lib/integrations/zoom/meetings.ts`
- Meeting creation uses auto-refresh token path from `lib/integrations/zoom/token-store.ts`
