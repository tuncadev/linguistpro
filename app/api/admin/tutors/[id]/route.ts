import { Prisma, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { conflict, notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { adminTutorSelect, serializeTutorForAdmin } from "@/lib/tutors/serialize";

const updateTutorSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(255).optional(),
    password: z.string().min(8).max(72).optional(),
    avatarUrl: z.string().trim().url().nullable().optional(),
    bio: z.string().trim().max(5000).nullable().optional(),
    rating: z.number().min(0).max(5).nullable().optional(),
    studentCount: z.number().int().min(0).max(1_000_000).nullable().optional(),
    coursesAuthored: z.number().int().min(0).max(1_000_000).nullable().optional(),
    location: z.string().trim().max(200).nullable().optional(),
    languagesSpoken: z.string().trim().max(240).nullable().optional(),
    profileHighlights: z.array(z.string().trim().min(1).max(240)).max(50).optional(),
    profileStats: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(80).optional(),
          label: z.string().trim().min(1).max(120),
          value: z.string().trim().min(1).max(120),
        })
      )
      .max(20)
      .optional(),
    pedagogicalModules: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(80).optional(),
          title: z.string().trim().min(1).max(160),
          description: z.string().trim().min(1).max(5000),
        })
      )
      .max(20)
      .optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.email !== undefined ||
      value.password !== undefined ||
      value.avatarUrl !== undefined ||
      value.bio !== undefined ||
      value.rating !== undefined ||
      value.studentCount !== undefined ||
      value.coursesAuthored !== undefined ||
      value.location !== undefined ||
      value.languagesSpoken !== undefined ||
      value.profileHighlights !== undefined ||
      value.profileStats !== undefined ||
      value.pedagogicalModules !== undefined,
    {
      message: "At least one field must be provided",
    }
  );

type Params = {
  params: Promise<{ id: string }>;
};

export const GET = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const { id } = await params;
  const tutor = await prisma.user.findFirst({
    where: { id, role: Role.TUTOR },
    select: adminTutorSelect,
  });

  if (!tutor) {
    notFound("Tutor not found");
  }

  return NextResponse.json({ data: serializeTutorForAdmin(tutor) });
});

export const PATCH = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const { id } = await params;
  const payload = await parseJsonBody(req, updateTutorSchema);

  const existing = await prisma.user.findFirst({
    where: { id, role: Role.TUTOR },
    select: { id: true },
  });
  if (!existing) {
    notFound("Tutor not found");
  }

  const email = payload.email?.toLowerCase();
  if (email) {
    const collision = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (collision && collision.id !== id) {
      conflict("Email is already registered");
    }
  }

  const passwordHash = payload.password ? await hashPassword(payload.password) : undefined;

  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: payload.name,
      email,
      passwordHash,
      avatarUrl: payload.avatarUrl,
      bio: payload.bio,
      rating: payload.rating,
      studentCount: payload.studentCount,
      coursesAuthored: payload.coursesAuthored,
      location: payload.location,
      languagesSpoken: payload.languagesSpoken,
      profileHighlights:
        payload.profileHighlights === undefined
          ? undefined
          : payload.profileHighlights === null
          ? null
          : (payload.profileHighlights as Prisma.InputJsonValue),
      profileStats:
        payload.profileStats === undefined
          ? undefined
          : payload.profileStats === null
          ? null
          : (payload.profileStats as Prisma.InputJsonValue),
      pedagogicalModules:
        payload.pedagogicalModules === undefined
          ? undefined
          : payload.pedagogicalModules === null
          ? null
          : (payload.pedagogicalModules as Prisma.InputJsonValue),
    },
    select: adminTutorSelect,
  });

  return NextResponse.json({ data: serializeTutorForAdmin(updated) });
});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const { id } = await params;
  const tutor = await prisma.user.findFirst({
    where: { id, role: Role.TUTOR },
    select: {
      id: true,
      _count: { select: { authoredCourses: true } },
    },
  });
  if (!tutor) {
    notFound("Tutor not found");
  }

  if (tutor._count.authoredCourses > 0) {
    conflict("Tutor has assigned courses. Reassign or remove courses first.");
  }

  await prisma.user.delete({
    where: { id },
  });

  return NextResponse.json({ deleted: true });
});
