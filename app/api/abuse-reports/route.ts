import { AbuseReportStatus, AbuseTargetType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthenticated } from "@/lib/auth/server-checks";
import { parseJsonBody, parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { abuseReportSelect, serializeAbuseReport } from "@/lib/moderation/abuse-reports";

const listQuerySchema = z.object({
  status: z.nativeEnum(AbuseReportStatus).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const createSchema = z.object({
  targetType: z.nativeEnum(AbuseTargetType),
  targetId: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(3).max(240),
  details: z.string().trim().min(1).max(5000).optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireAuthenticated(req);
  if (auth.ok === false) {
    return auth.response;
  }

  const query = parseQuery(req, listQuerySchema);
  const reports = await prisma.abuseReport.findMany({
    where: {
      reporterId: auth.session.id,
      status: query.status,
    },
    orderBy: { createdAt: "desc" },
    take: query.take ?? 50,
    skip: query.skip ?? 0,
    select: abuseReportSelect,
  });

  return NextResponse.json({
    data: reports.map(serializeAbuseReport),
    meta: {
      count: reports.length,
      take: query.take ?? 50,
      skip: query.skip ?? 0,
    },
  });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireAuthenticated(req);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, createSchema);
  const created = await prisma.abuseReport.create({
    data: {
      reporterId: auth.session.id,
      targetType: payload.targetType,
      targetId: payload.targetId,
      reason: payload.reason,
      details: payload.details ?? null,
    },
    select: abuseReportSelect,
  });

  return NextResponse.json({ data: serializeAbuseReport(created) }, { status: 201 });
});
