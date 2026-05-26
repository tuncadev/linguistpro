import crypto from "node:crypto";

type ZoomWebhookBasePayload = {
  event?: string;
  event_ts?: number;
  payload?: Record<string, unknown>;
};

function getWebhookSecret(): string {
  const secret = process.env.ZOOM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    throw new Error("ZOOM_WEBHOOK_SECRET is not configured");
  }
  return secret;
}

export function verifyZoomWebhookSignature(input: {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
}): boolean {
  const { rawBody, timestamp, signature } = input;
  if (!timestamp || !signature) {
    return false;
  }

  const secret = getWebhookSecret();
  const payload = `v0:${timestamp}:${rawBody}`;
  const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return signature === `v0=${digest}`;
}

export function buildZoomEndpointValidationResponse(plainToken: string): {
  plainToken: string;
  encryptedToken: string;
} {
  const secret = getWebhookSecret();
  const encryptedToken = crypto
    .createHmac("sha256", secret)
    .update(plainToken)
    .digest("hex");

  return {
    plainToken,
    encryptedToken,
  };
}

export function parseZoomWebhookPayload(rawBody: string): ZoomWebhookBasePayload {
  return JSON.parse(rawBody) as ZoomWebhookBasePayload;
}
