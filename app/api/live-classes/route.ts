import { LiveClassStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { createZoomMeeting } from "@/lib/integrations/zoom/meetings";
import { conflict, forbidden, notFound } from "@/lib/http/api-error";
import { parseJsonBody, parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { liveClassInclude, serializeLiveClassSession } from "@/lib/live-classes/serialize";
import { prisma } from "@/lib/prisma";

const listQuerySchema = z.object({
  courseId: z.string().trim().min(1).optional(),
  status: z.nativeEnum(LiveClassStatus).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const createLiveClassSchema = z.object({
  courseId: z.string().trim().min(1),
  title: z.string().trim().min(3).max(180),
  agenda: z.string().trim().max(3000).optional(),
  startsAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480),
  timezone: z.string().trim().min(2).max(80),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["STUDENT", "TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const query = parseQuery(req, listQuerySchema);
  const where: Prisma.LiveClassSessionWhereInput = {};

  if (query.courseId) {
    where.courseId = query.courseId;
  }
  if (query.status) {
    where.status = query.status;
  }

  if (auth.session.role === "STUDENT") {
    where.course = {
      enrollments: {
        some: { studentId: auth.session.id },
      },
    };
  } else if (auth.session.role === "TUTOR") {
    where.tutorId = auth.session.id;
  }

  const sessions = await prisma.liveClassSession.findMany({
    where,
    include: liveClassInclude,
    orderBy: { startsAt: "asc" },
    take: query.take ?? 50,
    skip: query.skip ?? 0,
  });

  return NextResponse.json({
    data: sessions.map((session) => serializeLiveClassSession(session, auth.session.role)),
    meta: {
      count: sessions.length,
      take: query.take ?? 50,
      skip: query.skip ?? 0,
    },
  });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, createLiveClassSchema);
  const course = await prisma.course.findUnique({
    where: { id: payload.courseId },
    select: {
      id: true,
      title: true,
      status: true,
      tutorId: true,
    },
  });

  if (!course) {
    notFound("Course not found");
  }

  const isAdmin = auth.session.role === "ADMIN";
  if (!isAdmin && course.tutorId !== auth.session.id) {
    forbidden();
  }

  if (course.status !== "PUBLISHED") {
    conflict("Only published courses can have live classes");
  }

  const zoomMeeting = await createZoomMeeting({
    userId: auth.session.id,
    topic: payload.title,
    agenda: payload.agenda ?? null,
    startTimeIso: payload.startsAt,
    durationMinutes: payload.durationMinutes,
    timezone: payload.timezone,
  });

  const created = await prisma.liveClassSession.create({
    data: {
      courseId: course.id,
      tutorId: course.tutorId,
      title: payload.title,
      agenda: payload.agenda ?? null,
      startsAt: new Date(payload.startsAt),
      durationMinutes: payload.durationMinutes,
      timezone: payload.timezone,
      status: "SCHEDULED",
      zoomMeetingId: String(zoomMeeting.id),
      zoomJoinUrl: zoomMeeting.join_url,
      zoomStartUrl: zoomMeeting.start_url ?? null,
      zoomPassword: zoomMeeting.password ?? null,
      zoomHostEmail: zoomMeeting.host_email ?? null,
    },
    include: liveClassInclude,
  });

  return NextResponse.json(
    {
      data: serializeLiveClassSession(created, auth.session.role),
    },
    { status: 201 }
  );
});
