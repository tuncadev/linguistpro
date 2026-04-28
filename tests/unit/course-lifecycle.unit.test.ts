import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/http/api-error";
import {
  assertCourseStatusTransition,
  buildLifecycleTimestamps,
} from "../../lib/courses/lifecycle";

describe("course lifecycle transitions", () => {
  it("allows tutor to submit draft to pending review", () => {
    expect(() => assertCourseStatusTransition("DRAFT", "PENDING_REVIEW", "TUTOR")).not.toThrow();
  });

  it("blocks tutor from privileged transitions", () => {
    expect(() => assertCourseStatusTransition("PENDING_REVIEW", "PUBLISHED", "TUTOR")).toThrow(ApiError);
    expect(() => assertCourseStatusTransition("DRAFT", "PUBLISHED", "TUTOR")).toThrow(ApiError);
  });

  it("allows admin lifecycle transitions", () => {
    expect(() => assertCourseStatusTransition("PENDING_REVIEW", "PUBLISHED", "ADMIN")).not.toThrow();
    expect(() => assertCourseStatusTransition("PUBLISHED", "ARCHIVED", "ADMIN")).not.toThrow();
    expect(() => assertCourseStatusTransition("ARCHIVED", "DRAFT", "ADMIN")).not.toThrow();
  });

  it("rejects invalid transitions for admin", () => {
    expect(() => assertCourseStatusTransition("PUBLISHED", "DRAFT", "ADMIN")).toThrow(ApiError);
    expect(() => assertCourseStatusTransition("ARCHIVED", "PUBLISHED", "ADMIN")).toThrow(ApiError);
  });
});

describe("course lifecycle timestamps", () => {
  it("sets publish timestamps when publishing", () => {
    const now = new Date("2026-04-28T12:00:00.000Z");
    const timestamps = buildLifecycleTimestamps("PUBLISHED", now);

    expect(timestamps.publishedAt?.toISOString()).toBe("2026-04-28T12:00:00.000Z");
    expect(timestamps.reviewedAt?.toISOString()).toBe("2026-04-28T12:00:00.000Z");
    expect(timestamps.archivedAt).toBeNull();
  });

  it("sets archive timestamp when archiving", () => {
    const now = new Date("2026-04-28T12:00:00.000Z");
    const timestamps = buildLifecycleTimestamps("ARCHIVED", now);

    expect(timestamps.archivedAt?.toISOString()).toBe("2026-04-28T12:00:00.000Z");
    expect(timestamps.reviewedAt?.toISOString()).toBe("2026-04-28T12:00:00.000Z");
  });
});
