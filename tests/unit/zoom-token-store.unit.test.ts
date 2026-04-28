import { describe, expect, it } from "vitest";
import { shouldRefreshZoomToken } from "../../lib/integrations/zoom/token-store";

describe("zoom token refresh threshold", () => {
  it("does not refresh when far from expiry", () => {
    const now = new Date("2026-04-28T10:00:00.000Z");
    const expiresAt = new Date("2026-04-28T10:10:00.000Z");
    expect(shouldRefreshZoomToken(expiresAt, now)).toBe(false);
  });

  it("refreshes when near expiry", () => {
    const now = new Date("2026-04-28T10:00:00.000Z");
    const expiresAt = new Date("2026-04-28T10:01:30.000Z");
    expect(shouldRefreshZoomToken(expiresAt, now)).toBe(true);
  });
});
