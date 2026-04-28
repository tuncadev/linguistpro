import { CourseStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { buildTutorIntegritySnapshot } from "../../lib/tutors/integrity";

describe("tutor-course integrity snapshot", () => {
  it("returns ok status when all course tutors exist", () => {
    const snapshot = buildTutorIntegritySnapshot(
      [
        { id: "tutor_1", name: "Tutor One", email: "t1@example.test" },
        { id: "tutor_2", name: "Tutor Two", email: "t2@example.test" },
      ],
      [
        { id: "course_1", title: "Course 1", tutorId: "tutor_1", status: CourseStatus.PUBLISHED },
        { id: "course_2", title: "Course 2", tutorId: "tutor_2", status: CourseStatus.DRAFT },
      ]
    );

    expect(snapshot.status).toBe("ok");
    expect(snapshot.orphanedTutorIdsInCourses).toEqual([]);
    expect(snapshot.orphanedTutorIdsInPublishedCourses).toEqual([]);
    expect(snapshot.unassignedTutorCount).toBe(0);
    expect(snapshot.distinctTutorIdsInCourses).toBe(2);
  });

  it("flags warning when a course references missing tutor", () => {
    const snapshot = buildTutorIntegritySnapshot(
      [{ id: "tutor_1", name: "Tutor One", email: "t1@example.test" }],
      [
        { id: "course_1", title: "Course 1", tutorId: "tutor_1", status: CourseStatus.PUBLISHED },
        { id: "course_2", title: "Course 2", tutorId: "ghost_tutor", status: CourseStatus.DRAFT },
      ]
    );

    expect(snapshot.status).toBe("warning");
    expect(snapshot.orphanedTutorIdsInCourses).toEqual(["ghost_tutor"]);
  });

  it("tracks unassigned tutor ids", () => {
    const snapshot = buildTutorIntegritySnapshot(
      [
        { id: "tutor_1", name: "Tutor One", email: "t1@example.test" },
        { id: "tutor_2", name: "Tutor Two", email: "t2@example.test" },
      ],
      [{ id: "course_1", title: "Course 1", tutorId: "tutor_1", status: CourseStatus.PUBLISHED }]
    );

    expect(snapshot.unassignedTutorCount).toBe(1);
    expect(snapshot.unassignedTutorIds).toEqual(["tutor_2"]);
  });
});
