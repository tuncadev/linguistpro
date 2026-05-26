import type { Prisma, Role } from "@prisma/client";

type LiveClassWithRelations = Prisma.LiveClassSessionGetPayload<{
  include: {
    course: {
      select: {
        id: true;
        title: true;
        status: true;
      };
    };
    tutor: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
  };
}>;

export const liveClassInclude = {
  course: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  tutor: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.LiveClassSessionInclude;

export function serializeLiveClassSession(session: LiveClassWithRelations, viewerRole: Role) {
  const isStudent = viewerRole === "STUDENT";
  return {
    id: session.id,
    courseId: session.courseId,
    tutorId: session.tutorId,
    title: session.title,
    agenda: session.agenda,
    startsAt: session.startsAt.toISOString(),
    durationMinutes: session.durationMinutes,
    timezone: session.timezone,
    status: session.status,
    zoomMeetingId: session.zoomMeetingId,
    zoomJoinUrl: session.zoomJoinUrl,
    zoomStartUrl: isStudent ? null : session.zoomStartUrl,
    zoomPassword: isStudent ? null : session.zoomPassword,
    zoomHostEmail: isStudent ? null : session.zoomHostEmail,
    cancelledAt: session.cancelledAt?.toISOString() ?? null,
    cancelledById: session.cancelledById ?? null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    course: session.course,
    tutor: session.tutor,
  };
}
