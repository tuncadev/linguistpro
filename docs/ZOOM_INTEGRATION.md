# Zoom Integration Foundation

Last updated: 2026-04-28

## Scope

This foundation implements:

- Zoom OAuth authorization URL generation
- OAuth `code` exchange to token pair
- Encrypted token persistence in DB
- Automatic access-token refresh without manual handling
- Connection status endpoint for tutor/admin users

## Environment Variables

- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_REDIRECT_URI`
- `INTEGRATION_ENCRYPTION_KEY` (base64-encoded 32-byte key for AES-256-GCM secret sealing)

Generate `INTEGRATION_ENCRYPTION_KEY` example:

```bash
openssl rand -base64 32
```

## Data Model

`ZoomConnection` (Prisma model) stores:

- Zoom identity (`zoomUserId`, `zoomAccountId`, `zoomEmail`)
- Sealed tokens (`accessTokenEnc`, `refreshTokenEnc`)
- Token metadata (`tokenType`, `scope`, `expiresAt`)
- Audit fields (`connectedAt`, `lastRefreshedAt`, `revokedAt`)

## API Endpoints

- `GET /api/integrations/zoom/oauth-url` (`TUTOR`, `ADMIN`)
  - Returns Zoom authorization URL
- `POST /api/integrations/zoom/connect` (`TUTOR`, `ADMIN`)
  - Body: `{ "code": "..." }`
  - Exchanges auth code and upserts encrypted connection
- `GET /api/integrations/zoom/status` (`TUTOR`, `ADMIN`)
  - Returns connection metadata and refresh-needs signal
- `POST /api/integrations/zoom/status` (`TUTOR`, `ADMIN`)
  - Forces token refresh path and validates access-token availability

## Token Refresh Contract

`lib/integrations/zoom/token-store.ts` exposes:

- `getZoomAccessTokenForUser({ userId })`
  - Returns a valid access token
  - Refreshes token when near expiry (`<= 120s`) and persists updated sealed tokens

This contract is used by future scheduling/attendance modules so they can call Zoom APIs without manual token operations.
