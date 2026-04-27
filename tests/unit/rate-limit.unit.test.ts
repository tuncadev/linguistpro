import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp, resetRateLimitStoreForTests } from "../../lib/security/rate-limit";

function makeRequest(ip = "127.0.0.1") {
  return new NextRequest("http://localhost/api/test", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("rate limiter", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it("allows requests under configured limit", () => {
    const req = makeRequest();
    const first = checkRateLimit(req, { key: "auth:test", limit: 2, windowMs: 60_000 });
    const second = checkRateLimit(req, { key: "auth:test", limit: 2, windowMs: 60_000 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
  });

  it("blocks requests when limit is exceeded", () => {
    const req = makeRequest();
    checkRateLimit(req, { key: "auth:test", limit: 1, windowMs: 60_000, blockMs: 120_000 });
    const blocked = checkRateLimit(req, { key: "auth:test", limit: 1, windowMs: 60_000, blockMs: 120_000 });

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("uses forwarded header ip when available", () => {
    const req = makeRequest("203.0.113.10, 10.0.0.1");
    expect(getClientIp(req)).toBe("203.0.113.10");
  });
});
