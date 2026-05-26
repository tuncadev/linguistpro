import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import { notFound } from "@/lib/http/api-error";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["STUDENT", "ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const [user, enrollmentCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: auth.session.id },
      select: {
        id: true,
        name: true,
        role: true,
        onboardingCompletedAt: true,
      },
    }),
    prisma.enrollment.count({
      where: {
        studentId: auth.session.id,
      },
    }),
  ]);

  if (!user) {
    notFound("Student not found");
  }

  const displayName = user.name?.trim() || "Student";
  const onboardingDone = Boolean(user.onboardingCompletedAt);
  const message = onboardingDone
    ? `Welcome back ${displayName}.`
    : `Welcome ${displayName}, let's complete your onboarding.`;

  return NextResponse.json({
    data: {
      message,
      onboardingCompleted: onboardingDone,
      enrollmentCount,
      suggestedNextStep:
        enrollmentCount > 0 ? "Continue your enrolled course." : "Pick your first published course.",
    },
  });
});
