import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import {
  assertCourseStatusTransition,
  buildLifecycleTimestamps,
  logCourseLifecycleEvent,
} from "@/lib/courses/lifecycle";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { conflict, forbidden, notFound } from "@/lib/http/api-error";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { requireApprovedTutor } from "@/lib/tutors/governance";

type Params = {
  params: Promise<{ id: string }>;
};

export const POST = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const existing = await prisma.course.findUnique({
    where: { id },
    select: { id: true, tutorId: true, status: true },
  });

  if (!existing) {
    notFound("Course not found");
  }

  const isAdmin = auth.session.role === "ADMIN";
  const isOwner = existing.tutorId === auth.session.id;
  if (!isAdmin && !isOwner) {
    forbidden();
  }

  if (!isAdmin) {
    await requireApprovedTutor(auth.session.id);
  }

  assertCourseStatusTransition(existing.status, "PENDING_REVIEW", auth.session.role);

  const now = new Date();
  const lifecycleTimestamps = buildLifecycleTimestamps("PENDING_REVIEW", now);

  const updated = await prisma.$transaction(async (tx) => {
    const course = await tx.course.update({
      where: { id },
      data: {
        status: "PENDING_REVIEW",
        publishedAt: lifecycleTimestamps.publishedAt ?? null,
        submittedAt: lifecycleTimestamps.submittedAt ?? now,
        reviewedAt: lifecycleTimestamps.reviewedAt ?? null,
        archivedAt: lifecycleTimestamps.archivedAt ?? null,
        statusReason: "Submitted for review",
        statusChangedById: auth.session.id,
        statusChangedAt: now,
      },
      include: courseInclude,
    });

    await logCourseLifecycleEvent(tx, {
      courseId: id,
      fromStatus: existing.status,
      toStatus: "PENDING_REVIEW",
      actorId: auth.session.id,
      actorRole: auth.session.role,
      reason: "Submitted for review",
      metadata: { source: "api/courses/[id]/submit#post" },
    });

    return course;
  });

  return NextResponse.json({
    data: serializeCourse(updated),
    submitted: true,
  });
});
