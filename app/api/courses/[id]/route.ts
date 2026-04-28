import { CourseStatus, LessonType, Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import { requireRoles } from "@/lib/auth/server-checks";
import {
  assertCourseStatusTransition,
  buildLifecycleTimestamps,
  logCourseLifecycleEvent,
} from "@/lib/courses/lifecycle";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { badRequest, conflict, forbidden, notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { requireApprovedTutor } from "@/lib/tutors/governance";

const updateCourseSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  price: z.number().min(0).max(100000).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().min(0).max(1_000_000).optional(),
  studentCount: z.number().int().min(0).max(1_000_000).optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  languageId: z.string().trim().min(1).optional(),
  levelId: z.string().trim().min(1).optional(),
  tutorId: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CourseStatus).optional(),
  syllabus: z.array(z.string().trim().min(1).max(180)).max(50).optional(),
  syllabusSections: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(180),
        lessons: z
          .array(
            z.object({
              title: z.string().trim().min(1).max(180),
              duration: z.string().trim().regex(/^\d{1,3}:[0-5]\d$/).optional(),
              type: z.enum(["video", "quiz", "reading"]).optional(),
              content: z.string().trim().max(10_000).optional(),
            })
          )
          .max(500)
          .optional(),
      })
    )
    .max(100)
    .optional(),
  learningObjectives: z.array(z.string().trim().min(1).max(220)).max(20).optional(),
  enrollmentIncludes: z.array(z.string().trim().min(1).max(220)).max(20).optional(),
  tuitionLabel: z.string().trim().min(1).max(80).nullable().optional(),
  discountLabel: z.string().trim().min(1).max(80).nullable().optional(),
  courseDirectorLabel: z.string().trim().min(1).max(80).nullable().optional(),
  statusReason: z.string().trim().max(500).nullable().optional(),
});

function parseDurationToSeconds(duration?: string): number | null {
  if (!duration) {
    return null;
  }

  const [minutesRaw, secondsRaw] = duration.split(":");
  const minutes = Number(minutesRaw);
  const seconds = Number(secondsRaw);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return null;
  }
  return minutes * 60 + seconds;
}

type Params = {
  params: Promise<{ id: string }>;
};

export const GET = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: courseInclude,
  });

  if (!course) {
    notFound("Course not found");
  }

  const session = await getSessionFromRequest(req);
  const canView =
    course.status === "PUBLISHED" ||
    session?.role === "ADMIN" ||
    session?.id === course.tutorId;

  if (!canView) {
    notFound("Course not found");
  }

  return NextResponse.json({ data: serializeCourse(course) });
});

export const PATCH = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const existing = await prisma.course.findUnique({
    where: { id },
    select: { id: true, tutorId: true, status: true, statusReason: true },
  });
  if (!existing) {
    notFound("Course not found");
  }

  const isAdmin = auth.session.role === "ADMIN";
  const isOwner = existing.tutorId === auth.session.id;

  if (!isAdmin && !isOwner) {
    forbidden();
  }

  const payload = await parseJsonBody(req, updateCourseSchema);

  if (!isAdmin && (payload.tutorId || payload.status)) {
    forbidden("Only admin can change tutorId or status");
  }

  if (payload.languageId) {
    const language = await prisma.language.findUnique({ where: { id: payload.languageId } });
    if (!language) {
      badRequest("Language not found");
    }
  }
  if (payload.levelId) {
    const level = await prisma.level.findUnique({ where: { id: payload.levelId } });
    if (!level) {
      badRequest("Level not found");
    }
  }
  if (payload.tutorId) {
    const tutor = await prisma.user.findFirst({
      where: { id: payload.tutorId, role: Role.TUTOR },
      select: { id: true },
    });
    if (!tutor) {
      badRequest("Tutor not found or user is not a tutor");
    }
  }

  if (isAdmin) {
    const effectiveTutorId = payload.tutorId ?? existing.tutorId;
    const publishingNow = payload.status === "PUBLISHED";
    const reassigningPublishedCourse =
      existing.status === "PUBLISHED" && payload.status === undefined && Boolean(payload.tutorId);
    if (publishingNow || reassigningPublishedCourse) {
      await requireApprovedTutor(effectiveTutorId);
    }
  }

  if (payload.status) {
    assertCourseStatusTransition(existing.status, payload.status, auth.session.role);
  }

  const { syllabus, syllabusSections, ...fields } = payload;
  const updateData: Prisma.CourseUpdateInput = { ...fields };

  const now = new Date();
  if (payload.status) {
    const timestamps = buildLifecycleTimestamps(payload.status, now);
    if ("publishedAt" in timestamps) {
      updateData.publishedAt = timestamps.publishedAt ?? null;
    }
    if ("submittedAt" in timestamps) {
      updateData.submittedAt = timestamps.submittedAt;
    }
    if ("reviewedAt" in timestamps) {
      updateData.reviewedAt = timestamps.reviewedAt;
    }
    if ("archivedAt" in timestamps) {
      updateData.archivedAt = timestamps.archivedAt;
    }
    updateData.statusChangedById = auth.session.id;
    updateData.statusChangedAt = now;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.course.update({
        where: { id },
        data: updateData,
      });
    }

    if (syllabusSections) {
      await tx.syllabusSection.deleteMany({ where: { courseId: id } });

      if (syllabusSections.length > 0) {
        await tx.course.update({
          where: { id },
          data: {
            syllabusSections: {
              create: syllabusSections.map((section, sectionIndex) => ({
                title: section.title,
                position: sectionIndex + 1,
                lessons: section.lessons?.length
                  ? {
                      create: section.lessons.map((lesson, lessonIndex) => ({
                        title: lesson.title,
                        type:
                          lesson.type === "quiz"
                            ? LessonType.QUIZ
                            : lesson.type === "reading"
                            ? LessonType.READING
                            : LessonType.VIDEO,
                        durationSeconds: parseDurationToSeconds(lesson.duration),
                        content: lesson.content ?? null,
                        position: lessonIndex + 1,
                      })),
                    }
                  : undefined,
              })),
            },
          },
        });
      }
    } else if (syllabus) {
      await tx.syllabusSection.deleteMany({ where: { courseId: id } });
      if (syllabus.length) {
        await tx.syllabusSection.createMany({
          data: syllabus.map((title, index) => ({
            courseId: id,
            title,
            position: index + 1,
          })),
        });
      }
    }

    const course = await tx.course.findUniqueOrThrow({
      where: { id },
      include: courseInclude,
    });

    if (payload.status && payload.status !== existing.status) {
      await logCourseLifecycleEvent(tx, {
        courseId: id,
        fromStatus: existing.status,
        toStatus: payload.status,
        actorId: auth.session.id,
        actorRole: auth.session.role,
        reason: payload.statusReason ?? "Status updated",
        metadata: { source: "api/courses/[id]#patch" },
      });
    }

    return course;
  });

  return NextResponse.json({ data: serializeCourse(updated) });
});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const course = await prisma.course.findUnique({
    where: { id },
    select: { id: true, tutorId: true, status: true },
  });
  if (!course) {
    notFound("Course not found");
  }

  const isAdmin = auth.session.role === "ADMIN";
  const isOwner = course.tutorId === auth.session.id;

  if (!isAdmin && !isOwner) {
    forbidden();
  }

  if (!isAdmin && course.status === "PUBLISHED") {
    conflict("Tutor cannot delete a published course");
  }

  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
});
