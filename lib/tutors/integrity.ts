import { CourseStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TutorSnapshotInput = {
  id: string;
  name: string | null;
  email: string;
};

type CourseSnapshotInput = {
  id: string;
  title: string;
  tutorId: string;
  status: CourseStatus;
};

export type TutorAssignmentSummary = {
  tutorId: string;
  name: string | null;
  email: string;
  assignedCourses: number;
  assignedPublishedCourses: number;
};

export type TutorIntegritySnapshot = {
  generatedAt: string;
  totalTutors: number;
  totalCourses: number;
  totalPublishedCourses: number;
  distinctTutorIdsInCourses: number;
  distinctTutorIdsInPublishedCourses: number;
  orphanedTutorIdsInCourses: string[];
  orphanedTutorIdsInPublishedCourses: string[];
  unassignedTutorCount: number;
  unassignedTutorIds: string[];
  tutorAssignments: TutorAssignmentSummary[];
  status: "ok" | "warning";
};

export function buildTutorIntegritySnapshot(
  tutors: TutorSnapshotInput[],
  courses: CourseSnapshotInput[]
): TutorIntegritySnapshot {
  const tutorIdSet = new Set(tutors.map((tutor) => tutor.id));
  const publishedCourses = courses.filter((course) => course.status === CourseStatus.PUBLISHED);

  const courseTutorIds = new Set(courses.map((course) => course.tutorId));
  const publishedCourseTutorIds = new Set(publishedCourses.map((course) => course.tutorId));

  const orphanedTutorIdsInCourses = [...courseTutorIds].filter((id) => !tutorIdSet.has(id)).sort();
  const orphanedTutorIdsInPublishedCourses = [...publishedCourseTutorIds]
    .filter((id) => !tutorIdSet.has(id))
    .sort();

  const tutorAssignments: TutorAssignmentSummary[] = tutors.map((tutor) => {
    const assignedCourses = courses.filter((course) => course.tutorId === tutor.id).length;
    const assignedPublishedCourses = publishedCourses.filter((course) => course.tutorId === tutor.id).length;
    return {
      tutorId: tutor.id,
      name: tutor.name,
      email: tutor.email,
      assignedCourses,
      assignedPublishedCourses,
    };
  });

  const unassignedTutorIds = tutorAssignments
    .filter((assignment) => assignment.assignedCourses === 0)
    .map((assignment) => assignment.tutorId);

  const status: "ok" | "warning" =
    orphanedTutorIdsInCourses.length > 0 || orphanedTutorIdsInPublishedCourses.length > 0 ? "warning" : "ok";

  return {
    generatedAt: new Date().toISOString(),
    totalTutors: tutors.length,
    totalCourses: courses.length,
    totalPublishedCourses: publishedCourses.length,
    distinctTutorIdsInCourses: courseTutorIds.size,
    distinctTutorIdsInPublishedCourses: publishedCourseTutorIds.size,
    orphanedTutorIdsInCourses,
    orphanedTutorIdsInPublishedCourses,
    unassignedTutorCount: unassignedTutorIds.length,
    unassignedTutorIds,
    tutorAssignments,
    status,
  };
}

export async function fetchTutorIntegritySnapshot(): Promise<TutorIntegritySnapshot> {
  const [tutors, courses] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.TUTOR },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.course.findMany({
      select: { id: true, title: true, tutorId: true, status: true },
    }),
  ]);

  return buildTutorIntegritySnapshot(tutors, courses);
}
