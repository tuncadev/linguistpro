import { CourseStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import { requireRoles } from "@/lib/auth/server-checks";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
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

export async function GET(req: NextRequest, { params }: Params) {
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: courseInclude,
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const session = await getSessionFromRequest(req);
  const canView =
    course.status === "PUBLISHED" ||
    session?.role === "ADMIN" ||
    session?.id === course.tutorId;

  if (!canView) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ data: serializeCourse(course) });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  const existing = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, tutorId: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const isAdmin = auth.session.role === "ADMIN";
  const isOwner = existing.tutorId === auth.session.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  if (!isAdmin && (payload.tutorId || payload.status)) {
    return NextResponse.json(
      { error: "Only admin can change tutorId or status" },
      { status: 403 }
    );
  }

  if (payload.languageId) {
    const language = await prisma.language.findUnique({ where: { id: payload.languageId } });
    if (!language) {
      return NextResponse.json({ error: "Language not found" }, { status: 400 });
    }
  }
  if (payload.levelId) {
    const level = await prisma.level.findUnique({ where: { id: payload.levelId } });
    if (!level) {
      return NextResponse.json({ error: "Level not found" }, { status: 400 });
    }
  }
  if (payload.tutorId) {
    const tutor = await prisma.user.findUnique({ where: { id: payload.tutorId } });
    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 400 });
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
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, tutorId: true, status: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const isAdmin = auth.session.role === "ADMIN";
  const isOwner = course.tutorId === auth.session.id;

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isAdmin && course.status === "PUBLISHED") {
    return NextResponse.json(
      { error: "Tutor cannot delete a published course" },
      { status: 409 }
    );
  }

  await prisma.course.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}

