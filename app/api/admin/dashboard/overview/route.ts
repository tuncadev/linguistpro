import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

type ActivityItem = {
  id: string;
  type: "enrollment" | "course_update";
  message: string;
  createdAt: string;
};

function toMillis(value: string): number {
  return new Date(value).getTime();
}

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    enrollmentsForRevenue,
    recentSubmissions,
    recentEnrollments,
    recentCourseUpdates,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.enrollment.findMany({
      select: {
        course: {
          select: {
            price: true,
          },
        },
      },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        tutorId: true,
        status: true,
        createdAt: true,
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        createdAt: true,
        course: {
          select: {
            title: true,
          },
        },
        student: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.course.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        tutor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const totalRevenue = enrollmentsForRevenue.reduce(
    (sum, enrollment) => sum + enrollment.course.price.toNumber(),
    0
  );

  const enrollmentActivity: ActivityItem[] = recentEnrollments.map((item) => {
    const studentName = item.student.name?.trim() || item.student.email;
    return {
      id: `enrollment:${item.id}`,
      type: "enrollment",
      message: `New student enrollment in "${item.course.title}" by ${studentName}`,
      createdAt: item.createdAt.toISOString(),
    };
  });

  const courseUpdateActivity: ActivityItem[] = recentCourseUpdates.map((item) => {
    const tutorName = item.tutor.name?.trim() || item.tutor.email;
    return {
      id: `course:${item.id}:${item.updatedAt.toISOString()}`,
      type: "course_update",
      message: `Tutor "${tutorName}" updated "${item.title}"`,
      createdAt: item.updatedAt.toISOString(),
    };
  });

  const activity = [...enrollmentActivity, ...courseUpdateActivity]
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))
    .slice(0, 8);

  return NextResponse.json({
    data: {
      stats: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalRevenue,
      },
      recentSubmissions: recentSubmissions.map((course) => ({
        id: course.id,
        title: course.title,
        tutorId: course.tutorId,
        tutorName: course.tutor.name?.trim() || course.tutor.email,
        status: course.status,
        createdAt: course.createdAt.toISOString(),
      })),
      activity,
    },
  });
});
