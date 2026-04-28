import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import { forbidden, notFound } from "@/lib/http/api-error";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export const GET = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const { id } = await params;
  const auth = await requireRoles(req, ["STUDENT", "TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const session = await prisma.liveClassSession.findUnique({
    where: { id },
    select: {
      id: true,
      courseId: true,
      tutorId: true,
      status: true,
      title: true,
      startsAt: true,
      durationMinutes: true,
      timezone: true,
      zoomJoinUrl: true,
      zoomMeetingId: true,
    },
  });

  if (!session) {
    notFound("Live class not found");
  }

  if (auth.session.role === "ADMIN") {
    return NextResponse.json({
      data: {
        id: session.id,
        zoomJoinUrl: session.zoomJoinUrl,
        zoomMeetingId: session.zoomMeetingId,
        title: session.title,
        startsAt: session.startsAt.toISOString(),
        durationMinutes: session.durationMinutes,
        timezone: session.timezone,
        status: session.status,
      },
    });
  }

  if (auth.session.role === "TUTOR") {
    if (session.tutorId !== auth.session.id) {
      forbidden();
    }

    return NextResponse.json({
      data: {
        id: session.id,
        zoomJoinUrl: session.zoomJoinUrl,
        zoomMeetingId: session.zoomMeetingId,
        title: session.title,
        startsAt: session.startsAt.toISOString(),
        durationMinutes: session.durationMinutes,
        timezone: session.timezone,
        status: session.status,
      },
    });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: session.courseId,
        studentId: auth.session.id,
      },
    },
    select: { id: true },
  });

  if (!enrollment) {
    forbidden("Student is not enrolled in this class course");
  }

  return NextResponse.json({
    data: {
      id: session.id,
      zoomJoinUrl: session.zoomJoinUrl,
      zoomMeetingId: session.zoomMeetingId,
      title: session.title,
      startsAt: session.startsAt.toISOString(),
      durationMinutes: session.durationMinutes,
      timezone: session.timezone,
      status: session.status,
    },
  });
});
