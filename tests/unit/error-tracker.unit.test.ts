import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reportError } from "../../lib/observability/error-tracker";

describe("error tracker", () => {
  const originalWebhookUrl = process.env.OBSERVABILITY_ERROR_WEBHOOK_URL;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    delete process.env.OBSERVABILITY_ERROR_WEBHOOK_URL;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    if (originalWebhookUrl === undefined) {
      delete process.env.OBSERVABILITY_ERROR_WEBHOOK_URL;
    } else {
      process.env.OBSERVABILITY_ERROR_WEBHOOK_URL = originalWebhookUrl;
    }

    if (originalFetch) {
      vi.stubGlobal("fetch", originalFetch);
    } else {
      vi.unstubAllGlobals();
    }

    vi.restoreAllMocks();
  });

  it("logs error locally when webhook is not configured", async () => {
    await expect(
      reportError(new Error("boom"), {
        requestId: "req_1",
        method: "GET",
        path: "/api/test",
        status: 500,
        durationMs: 4,
      })
    ).resolves.toBeUndefined();
  });

  it("posts error payload to webhook when configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    vi.stubGlobal("fetch", fetchMock);
    process.env.OBSERVABILITY_ERROR_WEBHOOK_URL = "https://example.com/webhook";

    await reportError(new Error("boom"), {
      requestId: "req_2",
      method: "POST",
      path: "/api/enroll",
      status: 500,
      durationMs: 12,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/webhook",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
