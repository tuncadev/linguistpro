import { CourseStatus } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type LearningAccessReason =
  | "ALLOWED"
  | "COURSE_NOT_FOUND"
  | "LESSON_NOT_FOUND"
  | "TUTOR_NOT_OWNER"
  | "COURSE_NOT_PUBLISHED"
  | "NOT_ENROLLED"
  | "TRIAL_LIMIT_REACHED";

export type EnrollmentAccessType = "PAID" | "TRIAL";

export const TRIAL_LESSON_LIMIT = 2;

export function evaluateLearningAccess(input: {
  role: SessionUser["role"];
  sessionUserId: string;
  courseTutorId: string;
  courseStatus: CourseStatus;
  enrollmentAccessType: EnrollmentAccessType | null;
  trialLessonLimitReached?: boolean;
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

  if (!input.enrollmentAccessType) {
    return { allowed: false, reason: "NOT_ENROLLED" };
  }

  if (input.enrollmentAccessType === "TRIAL" && input.trialLessonLimitReached) {
    return { allowed: false, reason: "TRIAL_LIMIT_REACHED" };
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
  enrollmentAccessType?: EnrollmentAccessType | null;
  trialLessonLimit?: number | null;
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

  let enrollmentAccessType: EnrollmentAccessType | null = null;
  let trialLessonLimitReached = false;

  if (input.session.role === "STUDENT") {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: input.courseId,
          studentId: input.session.id,
        },
      },
      select: { trial: true },
    });

    enrollmentAccessType = enrollment ? (enrollment.trial ? "TRIAL" : "PAID") : null;

    if (enrollmentAccessType === "TRIAL" && input.lessonId) {
      const orderedLessons = await prisma.lesson.findMany({
        where: {
          section: {
            courseId: input.courseId,
          },
        },
        select: { id: true },
        orderBy: [{ section: { position: "asc" } }, { position: "asc" }],
      });
      const lessonIndex = orderedLessons.findIndex((lesson) => lesson.id === input.lessonId);
      trialLessonLimitReached = lessonIndex >= TRIAL_LESSON_LIMIT;
    }
  }

  const decision = evaluateLearningAccess({
    role: input.session.role,
    sessionUserId: input.session.id,
    courseTutorId: course.tutorId,
    courseStatus: course.status,
    enrollmentAccessType:
      input.session.role === "STUDENT" ? enrollmentAccessType : ("PAID" as EnrollmentAccessType),
    trialLessonLimitReached,
  });

  return {
    ...decision,
    courseStatus: course.status,
    enrollmentAccessType: input.session.role === "STUDENT" ? enrollmentAccessType : null,
    trialLessonLimit:
      input.session.role === "STUDENT" && enrollmentAccessType === "TRIAL"
        ? TRIAL_LESSON_LIMIT
        : null,
  };
}
