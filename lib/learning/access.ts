import { CourseStatus } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type LearningAccessReason =
  | "ALLOWED"
  | "COURSE_NOT_FOUND"
  | "LESSON_NOT_FOUND"
  | "TUTOR_NOT_OWNER"
  | "COURSE_NOT_PUBLISHED"
  | "NOT_ENROLLED";

export function evaluateLearningAccess(input: {
  role: SessionUser["role"];
  sessionUserId: string;
  courseTutorId: string;
  courseStatus: CourseStatus;
  hasEnrollment: boolean;
}): { allowed: boolean; reason: LearningAccessReason } {
  if (input.role === "ADMIN") {
    return { allowed: true, reason: "ALLOWED" };
  }

  if (input.role === "TUTOR") {
    if (input.sessionUserId === input.courseTutorId) {
      return { allowed: true, reason: "ALLOWED" };
    }
    return { allowed: false, reason: "TUTOR_NOT_OWNER" };
  }

  if (input.courseStatus !== "PUBLISHED") {
    return { allowed: false, reason: "COURSE_NOT_PUBLISHED" };
  }

  if (!input.hasEnrollment) {
    return { allowed: false, reason: "NOT_ENROLLED" };
  }

  return { allowed: true, reason: "ALLOWED" };
}

export async function resolveLearningAccess(input: {
  courseId: string;
  lessonId?: string;
  session: SessionUser;
}): Promise<{
  allowed: boolean;
  reason: LearningAccessReason;
  courseStatus?: CourseStatus;
}> {
  const lessonFilter = input.lessonId
    ? {
        syllabusSections: {
          some: {
            lessons: {
              some: { id: input.lessonId },
            },
          },
        },
      }
    : {};

  const course = await prisma.course.findFirst({
    where: {
      id: input.courseId,
      ...lessonFilter,
    },
    select: {
      id: true,
      tutorId: true,
      status: true,
    },
  });

  if (!course) {
    if (input.lessonId) {
      const courseExists = await prisma.course.findUnique({
        where: { id: input.courseId },
        select: { id: true },
      });
      return {
        allowed: false,
        reason: courseExists ? "LESSON_NOT_FOUND" : "COURSE_NOT_FOUND",
      };
    }

    return {
      allowed: false,
      reason: "COURSE_NOT_FOUND",
    };
  }

  const hasEnrollment =
    input.session.role === "STUDENT"
      ? Boolean(
          await prisma.enrollment.findUnique({
            where: {
              courseId_studentId: {
                courseId: input.courseId,
                studentId: input.session.id,
              },
            },
            select: { id: true },
          })
        )
      : true;

  const decision = evaluateLearningAccess({
    role: input.session.role,
    sessionUserId: input.session.id,
    courseTutorId: course.tutorId,
    courseStatus: course.status,
    hasEnrollment,
  });

  return {
    ...decision,
    courseStatus: course.status,
  };
}
