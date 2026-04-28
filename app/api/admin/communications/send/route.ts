import { CommunicationTemplate } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { dispatchCommunication } from "@/lib/communications/dispatcher";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";

const sendSchema = z.object({
  template: z.nativeEnum(CommunicationTemplate),
  recipientEmail: z.string().trim().email().max(255),
  recipientName: z.string().trim().max(120).optional(),
  userId: z.string().trim().min(1).optional(),
  courseId: z.string().trim().min(1).optional(),
  liveClassSessionId: z.string().trim().min(1).optional(),
  templateData: z
    .object({
      recipientName: z.string().trim().max(120).optional(),
      courseTitle: z.string().trim().max(180).optional(),
      amountLabel: z.string().trim().max(120).optional(),
      liveClassTitle: z.string().trim().max(180).optional(),
      liveClassStartsAt: z.string().trim().max(120).optional(),
      timezone: z.string().trim().max(80).optional(),
      cancellationReason: z.string().trim().max(500).optional(),
    })
    .optional(),
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, sendSchema);
  const result = await dispatchCommunication({
    template: payload.template,
    recipientEmail: payload.recipientEmail,
    recipientName: payload.recipientName ?? null,
    userId: payload.userId ?? null,
    courseId: payload.courseId ?? null,
    liveClassSessionId: payload.liveClassSessionId ?? null,
    triggerKey: "admin.manual_send",
    templateData: payload.templateData,
  });

  return NextResponse.json({
    data: result,
  });
});
