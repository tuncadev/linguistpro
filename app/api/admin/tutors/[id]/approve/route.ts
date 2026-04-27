import { Role, TutorApprovalStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { adminTutorSelect, serializeTutorForAdmin } from "@/lib/tutors/serialize";

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().trim().max(1000).optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const { id } = await params;
  const parsed = await parseJsonBody(req, decisionSchema);

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true },
  });

  if (!existing || existing.role !== Role.TUTOR) {
    notFound("Tutor not found");
  }

  const approved = parsed.decision === "APPROVE";
  const updated = await prisma.user.update({
    where: { id },
    data: {
      tutorApprovalStatus: approved ? TutorApprovalStatus.APPROVED : TutorApprovalStatus.REJECTED,
      tutorApprovedAt: approved ? new Date() : null,
      tutorApprovalNotes: parsed.notes ?? null,
    },
    select: adminTutorSelect,
  });

  return NextResponse.json({
    data: serializeTutorForAdmin(updated),
    moderation: {
      decision: parsed.decision,
      moderatorId: auth.session.id,
      moderatedAt: new Date().toISOString(),
    },
  });
});
