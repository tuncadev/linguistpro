import { AbuseReportStatus, AbuseTargetType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { abuseReportSelect, serializeAbuseReport } from "@/lib/moderation/abuse-reports";

const querySchema = z.object({
  status: z.nativeEnum(AbuseReportStatus).optional(),
  targetType: z.nativeEnum(AbuseTargetType).optional(),
  q: z.string().trim().max(240).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const query = parseQuery(req, querySchema);
  const reports = await prisma.abuseReport.findMany({
    where: {
      status: query.status,
      targetType: query.targetType,
      OR: query.q
        ? [
            { reason: { contains: query.q, mode: "insensitive" } },
            { details: { contains: query.q, mode: "insensitive" } },
            { targetId: { contains: query.q, mode: "insensitive" } },
            { reporter: { email: { contains: query.q, mode: "insensitive" } } },
            { reporter: { name: { contains: query.q, mode: "insensitive" } } },
          ]
        : undefined,
    },
    orderBy: [{ createdAt: "desc" }],
    take: query.take ?? 100,
    skip: query.skip ?? 0,
    select: abuseReportSelect,
  });

  return NextResponse.json({
    data: reports.map(serializeAbuseReport),
    meta: {
      count: reports.length,
      take: query.take ?? 100,
      skip: query.skip ?? 0,
    },
  });
});
