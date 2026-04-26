import { Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { conflict, forbidden, notFound } from "@/lib/http/api-error";
import { parseJsonBody, parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

const listQuerySchema = z.object({
  mine: z.coerce.boolean().optional(),
  studentId: z.string().trim().min(1).optional(),
  courseId: z.string().trim().min(1).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const createEnrollmentSchema = z.object({
  courseId: z.string().trim().min(1),
  studentId: z.string().trim().min(1).optional(),
});

function serializeEnrollment(
  enrollment: Prisma.EnrollmentGetPayload<{
    include: {
      course: {
        select: {
          id: true;
          title: true;
          status: true;
        };
      };
      student: {
        select: {
          id: true;
          name: true;
          email: true;
          role: true;
        };
      };
    };
  }>
) {
  return {
    id: enrollment.id,
    courseId: enrollment.courseId,
    studentId: enrollment.studentId,
    createdAt: enrollment.createdAt.toISOString(),
    course: enrollment.course,
    student: enrollment.student,
  };
}

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["STUDENT", "TUTOR", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  const query = parseQuery(req, listQuerySchema);
  const where: Prisma.EnrollmentWhereInput = {};

  if (query.courseId) {
    where.courseId = query.courseId;
  }

  if (auth.session.role === "ADMIN") {
    if (query.studentId) {
      where.studentId = query.studentId;
    }
  } else {
    where.studentId = auth.session.id;
  }

  const enrollments = await prisma.enrollment.findMany({
    where,
    include: {
      course: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: query.take ?? 20,
    skip: query.skip ?? 0,
  });

  return NextResponse.json({
    data: enrollments.map(serializeEnrollment),
    meta: {
      count: enrollments.length,
      take: query.take ?? 20,
      skip: query.skip ?? 0,
    },
  });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["STUDENT", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, createEnrollmentSchema);
  const studentId =
    auth.session.role === "ADMIN" ? payload.studentId ?? auth.session.id : auth.session.id;
  const idempotencyKey = req.headers.get("idempotency-key") ?? null;

  const [student, course] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    }),
    prisma.course.findUnique({
      where: { id: payload.courseId },
      select: { id: true, status: true },
    }),
  ]);

  if (!student) {
    notFound("Student not found");
  }

  if (student.role !== Role.STUDENT && auth.session.role !== "ADMIN") {
    forbidden("Only STUDENT can enroll");
  }

  if (!course) {
    notFound("Course not found");
  }

  if (auth.session.role !== "ADMIN" && course.status !== "PUBLISHED") {
    conflict("Only published courses can be enrolled");
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          courseId: payload.courseId,
          studentId,
        },
        include: {
          course: {
            select: { id: true, title: true, status: true },
          },
          student: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      await tx.course.update({
        where: { id: payload.courseId },
        data: { studentCount: { increment: 1 } },
      });

      return enrollment;
    });

    return NextResponse.json(
      {
        data: serializeEnrollment(created),
        idempotentReplay: false,
        idempotencyKey,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prisma.enrollment.findUnique({
        where: {
          courseId_studentId: {
            courseId: payload.courseId,
            studentId,
          },
        },
        include: {
          course: {
            select: { id: true, title: true, status: true },
          },
          student: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      if (existing) {
        return NextResponse.json(
          {
            data: serializeEnrollment(existing),
            idempotentReplay: true,
            idempotencyKey,
          },
          { status: 200 }
        );
      }
    }

    console.error("enroll error", error);
    throw error;
  }
});
