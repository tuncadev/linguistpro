import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { prisma } from "@/lib/prisma";

type Params = {
  params: { id: string };
};

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireRoles(req, ["TUTOR", "ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  const existing = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, tutorId: true, status: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const isAdmin = auth.session.role === "ADMIN";
  const isOwner = existing.tutorId === auth.session.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (existing.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Only draft courses can be submitted for review" },
      { status: 409 }
    );
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
}

