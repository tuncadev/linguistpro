import { CourseStatus, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { sendEnrollmentConfirmation } from "@/lib/communications/workflows";
import { badRequest, conflict, notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

const updateOnboardingSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  bio: z.string().trim().max(5000).nullable().optional(),
  avatarUrl: z.string().trim().url().nullable().optional(),
  targetCourseId: z.string().trim().min(1).optional(),
  complete: z.boolean().optional(),
});

function resolveNextLessonPath(courseId: string, lessonId: string | null) {
  if (!lessonId) {
    return `/courses/${courseId}`;
  }
  return `/learn/${courseId}/${lessonId}`;
}

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["STUDENT", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      onboardingCompletedAt: true,
      welcomeDismissedAt: true,
    },
  });

  if (!user) {
    notFound("Student not found");
  }

  return NextResponse.json({
    data: {
      ...user,
      onboardingCompletedAt: user.onboardingCompletedAt?.toISOString() ?? null,
      welcomeDismissedAt: user.welcomeDismissedAt?.toISOString() ?? null,
    },
  });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["STUDENT", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, updateOnboardingSchema);
  const studentId = auth.session.id;

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, role: true },
  });
  if (!student || (student.role !== Role.STUDENT && auth.session.role !== "ADMIN")) {
    conflict("Only student onboarding is supported on this route");
  }

  let enrollment:
    | {
        id: string;
        courseId: string;
        createdAt: string;
      }
    | null = null;
  let createdNewEnrollment = false;
  let nextLessonPath: string | null = null;

  if (payload.targetCourseId) {
    const targetCourse = await prisma.course.findUnique({
      where: { id: payload.targetCourseId },
      select: {
        id: true,
        status: true,
        syllabusSections: {
          orderBy: { position: "asc" },
          select: {
            lessons: {
              orderBy: { position: "asc" },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!targetCourse) {
      notFound("Target course not found");
    }
    if (targetCourse.status !== CourseStatus.PUBLISHED) {
      badRequest("Target course must be published");
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId: targetCourse.id,
          studentId,
        },
      },
      select: { id: true, courseId: true, createdAt: true },
    });

    if (existingEnrollment) {
      enrollment = {
        id: existingEnrollment.id,
        courseId: existingEnrollment.courseId,
        createdAt: existingEnrollment.createdAt.toISOString(),
      };
    } else {
      const createdEnrollment = await prisma.$transaction(async (tx) => {
        const created = await tx.enrollment.create({
          data: {
            courseId: targetCourse.id,
            studentId,
            trial: false,
          },
          select: { id: true, courseId: true, createdAt: true },
        });
        return created;
      });

      enrollment = {
        id: createdEnrollment.id,
        courseId: createdEnrollment.courseId,
        createdAt: createdEnrollment.createdAt.toISOString(),
      };
      createdNewEnrollment = true;
    }

    const firstLessonId = targetCourse.syllabusSections[0]?.lessons[0]?.id ?? null;
    nextLessonPath = resolveNextLessonPath(targetCourse.id, firstLessonId);
  }

  const completeOnboarding = payload.complete ?? true;
  const updated = await prisma.user.update({
    where: { id: studentId },
    data: {
      name: payload.name,
      bio: payload.bio,
      avatarUrl: payload.avatarUrl,
      onboardingCompletedAt: completeOnboarding ? new Date() : undefined,
      welcomeDismissedAt: completeOnboarding ? new Date() : undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      bio: true,
      avatarUrl: true,
      onboardingCompletedAt: true,
      welcomeDismissedAt: true,
    },
  });

  if (createdNewEnrollment && enrollment) {
    void sendEnrollmentConfirmation({
      studentId,
      courseId: enrollment.courseId,
    }).catch((error) => {
      console.error("onboarding enrollment communication error", error);
    });
  }

  return NextResponse.json({
    data: {
      ...updated,
      onboardingCompletedAt: updated.onboardingCompletedAt?.toISOString() ?? null,
      welcomeDismissedAt: updated.welcomeDismissedAt?.toISOString() ?? null,
    },
    enrollment,
    nextLessonPath,
  });
});
