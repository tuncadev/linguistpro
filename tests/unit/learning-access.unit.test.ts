import { describe, expect, it } from "vitest";
import { evaluateLearningAccess } from "../../lib/learning/access";

describe("learning access policy", () => {
  it("allows admin access regardless of enrollment", () => {
    const decision = evaluateLearningAccess({
      role: "ADMIN",
      sessionUserId: "admin-1",
      courseTutorId: "tutor-1",
      courseStatus: "ARCHIVED",
      hasEnrollment: false,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBe("ALLOWED");
  });

  it("allows only owner tutor for lesson access", () => {
    const ownerDecision = evaluateLearningAccess({
      role: "TUTOR",
      sessionUserId: "tutor-1",
      courseTutorId: "tutor-1",
      courseStatus: "PUBLISHED",
      hasEnrollment: false,
    });
    const foreignDecision = evaluateLearningAccess({
      role: "TUTOR",
      sessionUserId: "tutor-2",
      courseTutorId: "tutor-1",
      courseStatus: "PUBLISHED",
      hasEnrollment: false,
    });

    expect(ownerDecision.allowed).toBe(true);
    expect(foreignDecision.allowed).toBe(false);
    expect(foreignDecision.reason).toBe("TUTOR_NOT_OWNER");
  });

  it("requires published course plus enrollment for students", () => {
    const noEnrollment = evaluateLearningAccess({
      role: "STUDENT",
      sessionUserId: "student-1",
      courseTutorId: "tutor-1",
      courseStatus: "PUBLISHED",
      hasEnrollment: false,
    });
    const draftBlocked = evaluateLearningAccess({
      role: "STUDENT",
      sessionUserId: "student-1",
      courseTutorId: "tutor-1",
      courseStatus: "DRAFT",
      hasEnrollment: true,
    });
    const allowed = evaluateLearningAccess({
      role: "STUDENT",
      sessionUserId: "student-1",
      courseTutorId: "tutor-1",
      courseStatus: "PUBLISHED",
      hasEnrollment: true,
    });

    expect(noEnrollment.allowed).toBe(false);
    expect(noEnrollment.reason).toBe("NOT_ENROLLED");
    expect(draftBlocked.allowed).toBe(false);
    expect(draftBlocked.reason).toBe("COURSE_NOT_PUBLISHED");
    expect(allowed.allowed).toBe(true);
    expect(allowed.reason).toBe("ALLOWED");
  });
});
