import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { conflict, notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

const moderateSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(500).optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const parsed = await parseJsonBody(req, moderateSchema);

  const existing = await prisma.course.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) {
    notFound("Course not found");
  }

  if (existing.status !== "PENDING_REVIEW") {
    conflict("Only pending_review courses can be moderated");
  }

  const approved = parsed.decision === "APPROVE";
  const updated = await prisma.course.update({
    where: { id },
    data: {
      status: approved ? "PUBLISHED" : "DRAFT",
      publishedAt: approved ? new Date() : null,
    },
    include: courseInclude,
  });

  return NextResponse.json({
    data: serializeCourse(updated),
    moderation: {
      decision: parsed.decision,
      reason: parsed.reason ?? null,
      moderatedBy: auth.session.id,
      moderatedAt: new Date().toISOString(),
    },
  });
});
