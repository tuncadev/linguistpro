import { Prisma, Role, TutorApprovalStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { badRequest, conflict } from "@/lib/http/api-error";
import { parseJsonBody, parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { ensureDefaultTutorAndRepairCourses } from "@/lib/tutors/ensure-default-tutor";
import { adminTutorSelect, serializeTutorForAdmin } from "@/lib/tutors/serialize";
import { resolveLocaleFromRequest } from "@/lib/i18n/api-messages";
import { loadLocaleMessagesRaw } from "@/lib/i18n/translation-registry";
import { localizeTutorFromMessages } from "@/lib/tutors/localization";

const listQuerySchema = z.object({
  q: z.string().trim().max(160).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const createTutorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  avatarUrl: z.string().trim().url().nullable().optional(),
  bio: z.string().trim().max(5000).nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
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
  tutorApprovalStatus: z.nativeEnum(TutorApprovalStatus).optional(),
  tutorApprovalNotes: z.string().trim().max(1000).nullable().optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  await ensureDefaultTutorAndRepairCourses();

  const locale = resolveLocaleFromRequest(req);
  const localeMessages = await loadLocaleMessagesRaw(locale);
  const query = parseQuery(req, listQuerySchema);
  const tutors = await prisma.user.findMany({
    where: {
      role: Role.TUTOR,
      OR: query.q
        ? [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
            { bio: { contains: query.q, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: [{ createdAt: "asc" }],
    take: query.take ?? 50,
    skip: query.skip ?? 0,
    select: adminTutorSelect,
  });

  return NextResponse.json({
    data: tutors.map((tutor) =>
      localizeTutorFromMessages(serializeTutorForAdmin(tutor), localeMessages)
    ),
    meta: {
      count: tutors.length,
      take: query.take ?? 50,
      skip: query.skip ?? 0,
    },
  });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, createTutorSchema);
  const email = payload.email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    conflict("Email is already registered");
  }

  const passwordHash = await hashPassword(payload.password);
  if (!passwordHash) {
    badRequest("Invalid password");
  }

  const created = await prisma.user.create({
    data: {
      role: Role.TUTOR,
      emailVerifiedAt: new Date(),
      name: payload.name,
      email,
      passwordHash,
      avatarUrl: payload.avatarUrl ?? null,
      bio: payload.bio ?? null,
      rating: payload.rating ?? null,
      location: payload.location ?? null,
      languagesSpoken: payload.languagesSpoken ?? null,
      profileHighlights: payload.profileHighlights
        ? (payload.profileHighlights as Prisma.InputJsonValue)
        : null,
      profileStats: payload.profileStats
        ? (payload.profileStats as Prisma.InputJsonValue)
        : null,
      pedagogicalModules: payload.pedagogicalModules
        ? (payload.pedagogicalModules as Prisma.InputJsonValue)
        : null,
      tutorApprovalStatus: payload.tutorApprovalStatus ?? TutorApprovalStatus.PENDING,
      tutorApprovedAt:
        payload.tutorApprovalStatus === TutorApprovalStatus.APPROVED ? new Date() : null,
      tutorApprovalNotes: payload.tutorApprovalNotes ?? null,
    },
    select: adminTutorSelect,
  });

  return NextResponse.json(
    {
      data: serializeTutorForAdmin(created),
    },
    { status: 201 }
  );
});
