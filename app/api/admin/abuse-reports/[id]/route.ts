import { AbuseReportStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { abuseReportSelect, serializeAbuseReport } from "@/lib/moderation/abuse-reports";

const updateSchema = z
  .object({
    status: z.nativeEnum(AbuseReportStatus).optional(),
    moderationNotes: z.string().trim().max(5000).nullable().optional(),
  })
  .refine((payload) => payload.status !== undefined || payload.moderationNotes !== undefined, {
    message: "At least one field must be provided",
  });

type Params = { params: Promise<{ id: string }> };

export const PATCH = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const { id } = await params;
  const payload = await parseJsonBody(req, updateSchema);

  const existing = await prisma.abuseReport.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) {
    notFound("Abuse report not found");
  }

  const updated = await prisma.abuseReport.update({
    where: { id },
    data: {
      status: payload.status,
      moderationNotes: payload.moderationNotes,
      reviewedById: auth.session.id,
      reviewedAt: new Date(),
    },
    select: abuseReportSelect,
  });

  return NextResponse.json({ data: serializeAbuseReport(updated) });
});
