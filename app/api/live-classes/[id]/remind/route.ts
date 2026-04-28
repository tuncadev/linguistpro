import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import { sendLiveClassReminderMessages } from "@/lib/communications/workflows";
import { forbidden, notFound } from "@/lib/http/api-error";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

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

  const result = await sendLiveClassReminderMessages(session.id);

  return NextResponse.json({
    data: {
      liveClassSessionId: session.id,
      notificationsSent: result.sent,
    },
  });
});
