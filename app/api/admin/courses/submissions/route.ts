import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { courseInclude, serializeCourse } from "@/lib/courses/serialize";
import { parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (!auth.ok) {
    return auth.response;
  }

  const query = parseQuery(req, querySchema);

  const courses = await prisma.course.findMany({
    where: { status: "PENDING_REVIEW" },
    include: courseInclude,
    orderBy: { updatedAt: "asc" },
    take: query.take ?? 20,
    skip: query.skip ?? 0,
  });

  return NextResponse.json({
    data: courses.map(serializeCourse),
    meta: {
      count: courses.length,
      take: query.take ?? 20,
      skip: query.skip ?? 0,
    },
  });
});
