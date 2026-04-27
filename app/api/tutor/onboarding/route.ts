import { Prisma, Role, TutorApprovalStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { conflict, notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

const updateTutorOnboardingSchema = z.object({
  bio: z.string().trim().max(5000).nullable().optional(),
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
  submitForApproval: z.boolean().optional(),
});

const tutorSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  bio: true,
  location: true,
  languagesSpoken: true,
  profileHighlights: true,
  profileStats: true,
  pedagogicalModules: true,
  tutorApprovalStatus: true,
  tutorApprovedAt: true,
  tutorApprovalNotes: true,
} satisfies Prisma.UserSelect;

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const tutor = await prisma.user.findUnique({
    where: { id: auth.session.id },
    select: tutorSelect,
  });

  if (!tutor || tutor.role !== Role.TUTOR) {
    notFound("Tutor not found");
  }

  const courseCounts = await prisma.course.groupBy({
    by: ["status"],
    where: { tutorId: tutor.id },
    _count: { _all: true },
  });

  return NextResponse.json({
    data: {
      ...tutor,
      tutorApprovedAt: tutor.tutorApprovedAt?.toISOString() ?? null,
      profileHighlights: tutor.profileHighlights ?? [],
      profileStats: tutor.profileStats ?? [],
      pedagogicalModules: tutor.pedagogicalModules ?? [],
      courseCounts,
    },
  });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, updateTutorOnboardingSchema);
  const tutor = await prisma.user.findUnique({
    where: { id: auth.session.id },
    select: { id: true, role: true, tutorApprovalStatus: true },
  });

  if (!tutor || tutor.role !== Role.TUTOR) {
    notFound("Tutor not found");
  }

  if (payload.submitForApproval && tutor.tutorApprovalStatus === TutorApprovalStatus.APPROVED) {
    conflict("Tutor is already approved");
  }

  const updated = await prisma.user.update({
    where: { id: tutor.id },
    data: {
      bio: payload.bio,
      location: payload.location,
      languagesSpoken: payload.languagesSpoken,
      profileHighlights:
        payload.profileHighlights === undefined
          ? undefined
          : (payload.profileHighlights as Prisma.InputJsonValue),
      profileStats:
        payload.profileStats === undefined ? undefined : (payload.profileStats as Prisma.InputJsonValue),
      pedagogicalModules:
        payload.pedagogicalModules === undefined
          ? undefined
          : (payload.pedagogicalModules as Prisma.InputJsonValue),
      tutorApprovalStatus: payload.submitForApproval ? TutorApprovalStatus.PENDING : undefined,
      tutorApprovalNotes: payload.submitForApproval ? null : undefined,
      tutorApprovedAt: payload.submitForApproval ? null : undefined,
    },
    select: tutorSelect,
  });

  return NextResponse.json({
    data: {
      ...updated,
      tutorApprovedAt: updated.tutorApprovedAt?.toISOString() ?? null,
      profileHighlights: updated.profileHighlights ?? [],
      profileStats: updated.profileStats ?? [],
      pedagogicalModules: updated.pedagogicalModules ?? [],
    },
  });
});
