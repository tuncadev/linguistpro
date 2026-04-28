# Transactional Communications

Last updated: 2026-04-28

## Scope

Implements template-based transactional messaging with persisted delivery attempts, retries, and failure observability.

Templates:

- `WELCOME`
- `ENROLLMENT_CONFIRMATION`
- `PAYMENT_RECEIPT`
- `CLASS_REMINDER`
- `CLASS_CANCELLATION`

## Storage

- `CommunicationMessage`: message payload, linkage, status, attempt counters
- `CommunicationAttempt`: per-attempt provider outcomes and errors

## Delivery Strategy

- Provider webhook env: `EMAIL_DELIVERY_WEBHOOK_URL`
- Retries: up to 3 attempts per message
- Local non-production fallback: `mock-local` successful delivery when webhook is absent
- Production fails fast if webhook URL is missing

## Trigger Wiring

- Welcome message: after successful email verification (`/api/auth/verify-email`)
- Enrollment confirmation: on new enrollment (`/api/enroll`, onboarding enrollment path)
- Class reminder: `/api/live-classes/:id/remind`
- Class cancellation: `/api/live-classes/:id/cancel`
- Payment receipt: template available through manual admin send endpoint until billing integration is enabled

## Manual Admin Endpoint

- `POST /api/admin/communications/send` (`ADMIN`)
  - allows template-triggered manual dispatch for operations and support
