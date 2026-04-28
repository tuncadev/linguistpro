# Zoom Attendance and Recording Sync

Last updated: 2026-04-28

## Scope

This module ingests Zoom webhook events and syncs attendance and recording metadata into platform tables.

## Webhook Endpoint

- `POST /api/webhooks/zoom`

Handled events:

- `endpoint.url_validation`
- `meeting.participant_joined`
- `meeting.participant_left`
- `recording.completed`

## Security

- Signature verification uses `x-zm-signature` + `x-zm-request-timestamp`
- HMAC payload format: `v0:{timestamp}:{rawBody}`
- Secret env key: `ZOOM_WEBHOOK_SECRET`

## Synced Tables

- `LiveClassAttendance`
  - one row per `(liveClassSessionId, participantId)`
  - tracks join count, join/leave timestamps, participant identity
- `LiveClassRecording`
  - one row per Zoom file id (`externalFileId`)
  - stores recording links and time boundaries

## Mapping Rule

Zoom meeting id (`payload.object.id`) maps to `LiveClassSession.zoomMeetingId`.
