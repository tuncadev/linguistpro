import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { conflict, forbidden, notFound } from "@/lib/http/api-error";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

type Params = {
  params: { id: string };
};

export const POST = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  const existing = await prisma.course.findUnique({
    where: { id: params.id },
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

  if (existing.status !== "DRAFT") {
    conflict("Only draft courses can be submitted for review");
  }

  const updated = await prisma.course.update({
    where: { id: params.id },
    data: { status: "PENDING_REVIEW", publishedAt: null },
    include: courseInclude,
  });

  return NextResponse.json({
    data: serializeCourse(updated),
    submitted: true,
  });
});
