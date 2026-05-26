import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import {
  assertCourseStatusTransition,
  buildLifecycleTimestamps,
  logCourseLifecycleEvent,
} from "@/lib/courses/lifecycle";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { conflict, notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { requireApprovedTutor } from "@/lib/tutors/governance";

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
    select: { id: true, status: true, tutorId: true },
  });
  if (!existing) {
    notFound("Course not found");
  }

  const approved = parsed.decision === "APPROVE";
  const nextStatus = approved ? "PUBLISHED" : "DRAFT";
  assertCourseStatusTransition(existing.status, nextStatus, auth.session.role);

  if (approved) {
    await requireApprovedTutor(existing.tutorId);
  }
  const now = new Date();
  const lifecycleTimestamps = buildLifecycleTimestamps(nextStatus, now);
  const updated = await prisma.$transaction(async (tx) => {
    const course = await tx.course.update({
      where: { id },
      data: {
        status: nextStatus,
        publishedAt: lifecycleTimestamps.publishedAt ?? null,
        reviewedAt: lifecycleTimestamps.reviewedAt ?? now,
        archivedAt: lifecycleTimestamps.archivedAt ?? null,
        statusReason: parsed.reason ?? null,
        statusChangedById: auth.session.id,
        statusChangedAt: now,
      },
      include: courseInclude,
    });

    await logCourseLifecycleEvent(tx, {
      courseId: id,
      fromStatus: existing.status,
      toStatus: nextStatus,
      actorId: auth.session.id,
      actorRole: auth.session.role,
      reason: parsed.reason ?? (approved ? "Approved by admin" : "Rejected by admin"),
      metadata: { source: "api/admin/courses/[id]/moderate#post", decision: parsed.decision },
    });

    return course;
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
