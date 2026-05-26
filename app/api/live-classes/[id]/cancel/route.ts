import { LiveClassStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { sendLiveClassCancellationMessages } from "@/lib/communications/workflows";
import { conflict, forbidden, notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

const cancelSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, cancelSchema);
  const session = await prisma.liveClassSession.findUnique({
    where: { id },
    select: { id: true, tutorId: true, status: true },
  });
  if (!session) {
    notFound("Live class not found");
  }

  if (auth.session.role !== "ADMIN" && session.tutorId !== auth.session.id) {
    forbidden();
  }
  if (session.status === LiveClassStatus.CANCELLED) {
    conflict("Live class already cancelled");
  }

  const updated = await prisma.liveClassSession.update({
    where: { id: session.id },
    data: {
      status: LiveClassStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledById: auth.session.id,
    },
    select: {
      id: true,
      status: true,
      cancelledAt: true,
      cancelledById: true,
    },
  });

  const notify = await sendLiveClassCancellationMessages({
    liveClassSessionId: updated.id,
    reason: payload.reason ?? null,
  });

  return NextResponse.json({
    data: {
      ...updated,
      cancelledAt: updated.cancelledAt?.toISOString() ?? null,
      notificationsSent: notify.sent,
    },
  });
});
