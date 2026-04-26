import { beforeEach, describe, expect, it } from "vitest";
import {
  getMetricsSnapshot,
  recordApiRequest,
  resetMetricsForTests,
} from "../../lib/observability/metrics";

describe("observability metrics", () => {
  beforeEach(() => {
    resetMetricsForTests();
  });

  it("tracks status classes and totals", () => {
    recordApiRequest({ method: "GET", path: "/api/courses", status: 200, durationMs: 15 });
    recordApiRequest({ method: "GET", path: "/api/courses", status: 404, durationMs: 8 });
    recordApiRequest({ method: "POST", path: "/api/enroll", status: 500, durationMs: 22 });

    const snapshot = getMetricsSnapshot();
    expect(snapshot.totalRequests).toBe(3);
    expect(snapshot.totalErrors).toBe(1);
    expect(snapshot.byStatusClass).toEqual({
      s2xx: 1,
      s3xx: 0,
      s4xx: 1,
      s5xx: 1,
    });
  });

  it("aggregates per-route metrics and respects limit", () => {
    recordApiRequest({ method: "GET", path: "/api/courses", status: 200, durationMs: 11 });
    recordApiRequest({ method: "GET", path: "/api/courses", status: 200, durationMs: 13 });
    recordApiRequest({ method: "GET", path: "/api/health", status: 200, durationMs: 3 });

    const snapshot = getMetricsSnapshot(1);
    expect(snapshot.routes).toHaveLength(1);
    expect(snapshot.routes[0]).toMatchObject({
      method: "GET",
      path: "/api/courses",
      total: 2,
      lastStatus: 200,
    });
  });
});
