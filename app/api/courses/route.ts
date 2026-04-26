import { CourseStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import { requireRoles } from "@/lib/auth/server-checks";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { badRequest, forbidden, notFound } from "@/lib/http/api-error";
import { parseJsonBody, parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

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

const createCourseSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  price: z.number().min(0).max(100000),
  imageUrl: z.string().trim().url().optional(),
  tutorId: z.string().trim().min(1).optional(),
  languageId: z.string().trim().min(1),
  levelId: z.string().trim().min(1),
  syllabus: z.array(z.string().trim().min(1).max(180)).max(50).optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const parsed = parseQuery(req, listQuerySchema);
  const session = await getSessionFromRequest(req);
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
    data: courses.map(serializeCourse),
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
  const tutorId = auth.session.role === "ADMIN" ? payload.tutorId ?? auth.session.id : auth.session.id;

  const [language, level, tutor] = await Promise.all([
    prisma.language.findUnique({ where: { id: payload.languageId } }),
    prisma.level.findUnique({ where: { id: payload.levelId } }),
    prisma.user.findUnique({ where: { id: tutorId } }),
  ]);

  if (!language) {
    badRequest("Language not found");
  }
  if (!level) {
    badRequest("Level not found");
  }
  if (!tutor) {
    notFound("Tutor not found");
  }

  const created = await prisma.course.create({
    data: {
      title: payload.title,
      description: payload.description,
      price: payload.price,
      imageUrl: payload.imageUrl,
      status: "DRAFT",
      tutorId,
      languageId: payload.languageId,
      levelId: payload.levelId,
      syllabusSections: payload.syllabus?.length
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

  return NextResponse.json({ data: serializeCourse(created) }, { status: 201 });
});
