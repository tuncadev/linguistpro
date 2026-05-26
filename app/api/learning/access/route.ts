import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { resolveLearningAccess } from "@/lib/learning/access";

const accessQuerySchema = z.object({
  courseId: z.string().trim().min(1),
  lessonId: z.string().trim().min(1).optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["STUDENT", "TUTOR", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const query = parseQuery(req, accessQuerySchema);
  const access = await resolveLearningAccess({
    courseId: query.courseId,
    lessonId: query.lessonId,
    session: auth.session,
  });

  if (!access.allowed) {
    const status =
      access.reason === "COURSE_NOT_FOUND" || access.reason === "LESSON_NOT_FOUND" ? 404 : 403;
    return NextResponse.json(
      {
        error: "Learning access denied",
        reason: access.reason,
      },
      { status }
    );
  }

  return NextResponse.json({
    data: {
      allowed: true,
      reason: access.reason,
      courseStatus: access.courseStatus ?? null,
      enrollmentAccessType: access.enrollmentAccessType ?? null,
      trialLessonLimit: access.trialLessonLimit ?? null,
    },
  });
});
