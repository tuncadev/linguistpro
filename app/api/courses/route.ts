import { CourseStatus, LessonType, Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import { requireRoles } from "@/lib/auth/server-checks";
import {
  buildLifecycleTimestamps,
  logCourseLifecycleEvent,
} from "@/lib/courses/lifecycle";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import {
  DEFAULT_COURSE_DIRECTOR_LABEL,
  DEFAULT_COURSE_DISCOUNT_LABEL,
  DEFAULT_COURSE_ENROLLMENT_INCLUDES,
  DEFAULT_COURSE_LEARNING_OBJECTIVES,
  DEFAULT_COURSE_TUITION_LABEL,
} from "@/lib/courses/presentation-defaults";
import { badRequest, conflict, forbidden } from "@/lib/http/api-error";
import { parseJsonBody, parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { requireApprovedTutor } from "@/lib/tutors/governance";
import { resolveLocaleFromRequest } from "@/lib/i18n/api-messages";
import { localizeCourseFromMessages } from "@/lib/courses/localization";
import { loadLocaleMessagesRaw } from "@/lib/i18n/translation-registry";

const listQuerySchema = z.object({
  q: z.string().trim().max(160).optional(),
  languageId: z.string().trim().min(1).optional(),
  levelId: z.string().trim().min(1).optional(),
  tutorId: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CourseStatus).optional(),
  mine: z.coerce.boolean().optional(),
  includeUnpublished: z.coerce.boolean().optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const dataImageUrlPattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/;

const imageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) =>
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      dataImageUrlPattern.test(value),
    "Invalid image URL format"
  );

const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  price: z.number().min(0).max(100000),
  imageUrl: imageUrlSchema.optional(),
  tutorId: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CourseStatus).optional(),
  languageId: z.string().trim().min(1),
  levelId: z.string().trim().min(1),
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
  tuitionLabel: z.string().trim().min(1).max(80).optional(),
  discountLabel: z.string().trim().min(1).max(80).optional(),
  courseDirectorLabel: z.string().trim().min(1).max(80).optional(),
  statusReason: z.string().trim().max(500).optional(),
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

export const GET = withApiHandler(async (req: NextRequest) => {
  const parsed = parseQuery(req, listQuerySchema);
  const session = await getSessionFromRequest(req);
  const locale = resolveLocaleFromRequest(req);
  const localeMessages = await loadLocaleMessagesRaw(locale);
  const where: Prisma.CourseWhereInput = {};
  const query = parsed;

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }
  if (query.languageId) where.languageId = query.languageId;
  if (query.levelId) where.levelId = query.levelId;
  if (query.tutorId) where.tutorId = query.tutorId;

  if (query.mine) {
    if (!session) {
      return NextResponse.json({ error: "Authentication required for mine=true" }, { status: 401 });
    }
    if (session.role !== "TUTOR" && session.role !== "ADMIN") {
      forbidden();
    }
    if (session.role !== "ADMIN") {
      where.tutorId = session.id;
    }
    if (query.status) {
      where.status = query.status;
    }
  } else if (session?.role === "ADMIN" && query.includeUnpublished) {
    if (query.status) {
      where.status = query.status;
    }
  } else {
    if (query.status && query.status !== "PUBLISHED") {
      forbidden("Forbidden status filter");
    }
    where.status = "PUBLISHED";
  }

  const courses = await prisma.course.findMany({
    where,
    include: courseInclude,
    orderBy: { createdAt: "desc" },
    take: query.take ?? 20,
    skip: query.skip ?? 0,
  });

  return NextResponse.json({
    data: courses.map((course) => localizeCourseFromMessages(serializeCourse(course), localeMessages)),
    meta: {
      count: courses.length,
      take: query.take ?? 20,
      skip: query.skip ?? 0,
    },
  });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, createCourseSchema);
  const isAdmin = auth.session.role === "ADMIN";
  if (!isAdmin && payload.status) {
    forbidden("Only admin can set status during course creation");
  }

  if (!isAdmin) {
    await requireApprovedTutor(auth.session.id);
  }

  let tutorId = auth.session.id;
  if (isAdmin) {
    if (payload.tutorId) {
      tutorId = payload.tutorId;
    } else {
      const fallbackTutor = await prisma.user.findFirst({
        where: { role: Role.TUTOR },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!fallbackTutor) {
        badRequest("No tutor available. Create a tutor before creating courses.");
      }

      tutorId = fallbackTutor.id;
    }
  }
  const status = isAdmin ? payload.status ?? "PUBLISHED" : "DRAFT";
  if (isAdmin && payload.status && payload.status !== "DRAFT" && payload.status !== "PUBLISHED") {
    conflict("Admin creation supports only DRAFT or PUBLISHED status");
  }

  const [language, level, tutor] = await Promise.all([
    prisma.language.findUnique({ where: { id: payload.languageId } }),
    prisma.level.findUnique({ where: { id: payload.levelId } }),
    prisma.user.findFirst({ where: { id: tutorId, role: Role.TUTOR } }),
  ]);

  if (!language) {
    badRequest("Language not found");
  }
  if (!level) {
    badRequest("Level not found");
  }
  if (!tutor) {
    badRequest("Tutor not found or user is not a tutor");
  }

  if (isAdmin && status === "PUBLISHED") {
    await requireApprovedTutor(tutorId);
  }

  const now = new Date();
  const lifecycleTimestamps = buildLifecycleTimestamps(status, now);

  const created = await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        imageUrl: payload.imageUrl,
        status,
        publishedAt: lifecycleTimestamps.publishedAt ?? null,
        submittedAt: lifecycleTimestamps.submittedAt ?? null,
        reviewedAt: lifecycleTimestamps.reviewedAt ?? null,
        archivedAt: lifecycleTimestamps.archivedAt ?? null,
        statusReason: payload.statusReason ?? null,
        statusChangedById: auth.session.id,
        statusChangedAt: now,
        tutorId,
        languageId: payload.languageId,
        levelId: payload.levelId,
        learningObjectives: payload.learningObjectives ?? DEFAULT_COURSE_LEARNING_OBJECTIVES,
        enrollmentIncludes: payload.enrollmentIncludes ?? DEFAULT_COURSE_ENROLLMENT_INCLUDES,
        tuitionLabel: payload.tuitionLabel ?? DEFAULT_COURSE_TUITION_LABEL,
        discountLabel: payload.discountLabel ?? DEFAULT_COURSE_DISCOUNT_LABEL,
        courseDirectorLabel: payload.courseDirectorLabel ?? DEFAULT_COURSE_DIRECTOR_LABEL,
        syllabusSections: payload.syllabusSections?.length
          ? {
              create: payload.syllabusSections.map((section, sectionIndex) => ({
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
            }
          : payload.syllabus?.length
          ? {
              create: payload.syllabus.map((title, index) => ({
                title,
                position: index + 1,
              })),
            }
          : undefined,
      },
      include: courseInclude,
    });

    await logCourseLifecycleEvent(tx, {
      courseId: course.id,
      fromStatus: null,
      toStatus: status,
      actorId: auth.session.id,
      actorRole: auth.session.role,
      reason: payload.statusReason ?? "Course created",
      metadata: { source: "api/courses#create" },
    });

    return course;
  });

  return NextResponse.json({ data: serializeCourse(created) }, { status: 201 });
});
