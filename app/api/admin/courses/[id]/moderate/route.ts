import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { prisma } from "@/lib/prisma";

const moderateSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(500).optional(),
});

type Params = {
  params: { id: string };
};

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = moderateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid moderation payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.course.findUnique({
    where: { id: params.id },
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  if (existing.status !== "PENDING_REVIEW") {
    return NextResponse.json(
      { error: "Only pending_review courses can be moderated" },
      { status: 409 }
    );
  }

  const approved = parsed.data.decision === "APPROVE";
  const updated = await prisma.course.update({
    where: { id: params.id },
    data: {
      status: approved ? "PUBLISHED" : "DRAFT",
      publishedAt: approved ? new Date() : null,
    },
    include: courseInclude,
  });

  return NextResponse.json({
    data: serializeCourse(updated),
    moderation: {
      decision: parsed.data.decision,
      reason: parsed.data.reason ?? null,
      moderatedBy: auth.session.id,
      moderatedAt: new Date().toISOString(),
    },
  });
}

