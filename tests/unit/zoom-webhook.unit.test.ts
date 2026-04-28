import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildZoomEndpointValidationResponse,
  verifyZoomWebhookSignature,
} from "../../lib/integrations/zoom/webhook";
import crypto from "node:crypto";

describe("zoom webhook signature helpers", () => {
  const originalSecret = process.env.ZOOM_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.ZOOM_WEBHOOK_SECRET = "zoom-webhook-test-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.ZOOM_WEBHOOK_SECRET;
    } else {
      process.env.ZOOM_WEBHOOK_SECRET = originalSecret;
    }
  });

  it("verifies valid Zoom v0 signatures", () => {
    const rawBody = JSON.stringify({ event: "meeting.participant_joined" });
    const timestamp = "1714300000";
    const payload = `v0:${timestamp}:${rawBody}`;
    const digest = crypto
      .createHmac("sha256", "zoom-webhook-test-secret")
      .update(payload)
      .digest("hex");
    const signature = `v0=${digest}`;

    expect(
      verifyZoomWebhookSignature({
        rawBody,
        timestamp,
        signature,
      })
    ).toBe(true);
  });

  it("rejects invalid signatures", () => {
    expect(
      verifyZoomWebhookSignature({
        rawBody: "{}",
        timestamp: "1714300000",
        signature: "v0=bad",
      })
    ).toBe(false);
  });

  it("builds endpoint validation response", () => {
    const result = buildZoomEndpointValidationResponse("plain-123");
    expect(result.plainToken).toBe("plain-123");
    expect(result.encryptedToken).toHaveLength(64);
  });
});
