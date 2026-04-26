import { CourseStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import { requireRoles } from "@/lib/auth/server-checks";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { badRequest, conflict, forbidden, notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

const updateCourseSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  price: z.number().min(0).max(100000).optional(),
  imageUrl: z.string().trim().url().nullable().optional(),
  languageId: z.string().trim().min(1).optional(),
  levelId: z.string().trim().min(1).optional(),
  tutorId: z.string().trim().min(1).optional(),
  status: z.nativeEnum(CourseStatus).optional(),
  syllabus: z.array(z.string().trim().min(1).max(180)).max(50).optional(),
});

type Params = {
  params: { id: string };
};

export const GET = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
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
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  const existing = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, tutorId: true, status: true },
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
    const tutor = await prisma.user.findUnique({ where: { id: payload.tutorId } });
    if (!tutor) {
      notFound("Tutor not found");
    }
  }

  const { syllabus, ...fields } = payload;
  const updateData: Prisma.CourseUpdateInput = { ...fields };

  if (isAdmin && payload.status === "PUBLISHED") {
    updateData.publishedAt = new Date();
  }
  if (isAdmin && payload.status && payload.status !== "PUBLISHED") {
    updateData.publishedAt = null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(updateData).length > 0) {
      await tx.course.update({
        where: { id: params.id },
        data: updateData,
      });
    }

    if (syllabus) {
      await tx.syllabusSection.deleteMany({ where: { courseId: params.id } });
      if (syllabus.length) {
        await tx.syllabusSection.createMany({
          data: syllabus.map((title, index) => ({
            courseId: params.id,
            title,
            position: index + 1,
          })),
        });
      }
    }

    return tx.course.findUniqueOrThrow({
      where: { id: params.id },
      include: courseInclude,
    });
  });

  return NextResponse.json({ data: serializeCourse(updated) });
});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  const course = await prisma.course.findUnique({
    where: { id: params.id },
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

  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
});
