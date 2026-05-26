import type { CourseStatus, Prisma, Role } from "@prisma/client";
import { conflict } from "@/lib/http/api-error";

const ALLOWED_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  DRAFT: ["PENDING_REVIEW", "PUBLISHED", "ARCHIVED"],
  PENDING_REVIEW: ["PUBLISHED", "DRAFT", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export function assertCourseStatusTransition(
  currentStatus: CourseStatus,
  nextStatus: CourseStatus,
  actorRole: Role
) {
  if (currentStatus === nextStatus) {
    return;
  }

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowedTargets.includes(nextStatus)) {
    conflict(`Invalid course status transition: ${currentStatus} -> ${nextStatus}`);
  }

  if (actorRole !== "ADMIN") {
    const tutorAllowed = currentStatus === "DRAFT" && nextStatus === "PENDING_REVIEW";
    if (!tutorAllowed) {
      conflict("Only admin can perform this lifecycle transition");
    }
  }
}

export function buildLifecycleTimestamps(
  nextStatus: CourseStatus,
  now: Date
): {
  publishedAt?: Date | null;
  submittedAt?: Date | null;
  reviewedAt?: Date | null;
  archivedAt?: Date | null;
} {
  if (nextStatus === "PENDING_REVIEW") {
    return { submittedAt: now, reviewedAt: null, archivedAt: null, publishedAt: null };
  }

  if (nextStatus === "PUBLISHED") {
    return { publishedAt: now, reviewedAt: now, archivedAt: null };
  }

  if (nextStatus === "ARCHIVED") {
    return { archivedAt: now, reviewedAt: now };
  }

  return { publishedAt: null, archivedAt: null };
}

type LifecycleWriter = {
  courseLifecycleEvent: {
    create(args: Prisma.CourseLifecycleEventCreateArgs): Promise<unknown>;
  };
};

export async function logCourseLifecycleEvent(
  writer: LifecycleWriter,
  input: {
    courseId: string;
    fromStatus: CourseStatus | null;
    toStatus: CourseStatus;
    actorId: string;
    actorRole: Role;
    reason?: string | null;
    metadata?: Prisma.JsonValue;
  }
) {
  await writer.courseLifecycleEvent.create({
    data: {
      courseId: input.courseId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      actorId: input.actorId,
      actorRole: input.actorRole,
      reason: input.reason ?? null,
      metadata: input.metadata ?? undefined,
    },
  });
}
