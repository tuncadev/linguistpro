import {
  CommunicationStatus,
  CourseStatus,
  LiveClassStatus,
  TutorApprovalStatus,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireRoles } from "@/lib/auth/server-checks";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";

type ActivityItem = {
  id: string;
  type: "enrollment" | "course_update" | "communication" | "live_class";
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

  const now = new Date();
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalStudents,
    onboardingCompletedStudents,
    totalTutors,
    approvedTutors,
    pendingTutors,
    enrollmentsForRevenue,
    enrollmentsForRevenue30d,
    recentSubmissions,
    recentEnrollments,
    recentCourseUpdates,
    pendingCourseSubmissions,
    liveClassStatusGroups,
    upcomingLiveClasses,
    attendanceAggregate,
    recordingsCount,
    communicationGroups,
    communicationGroups7d,
    recentCommunicationFailures,
    recentLiveClassCancellations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.user.count({
      where: { role: "STUDENT" },
    }),
    prisma.user.count({
      where: { role: "STUDENT", onboardingCompletedAt: { not: null } },
    }),
    prisma.user.count({
      where: { role: "TUTOR" },
    }),
    prisma.user.count({
      where: { role: "TUTOR", tutorApprovalStatus: TutorApprovalStatus.APPROVED },
    }),
    prisma.user.count({
      where: { role: "TUTOR", tutorApprovalStatus: TutorApprovalStatus.PENDING },
    }),
    prisma.enrollment.findMany({
      select: {
        course: {
          select: {
            price: true,
          },
        },
      },
    }),
    prisma.enrollment.findMany({
      where: {
        createdAt: { gte: last30Days },
      },
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
    prisma.course.count({
      where: { status: CourseStatus.PENDING_REVIEW },
    }),
    prisma.liveClassSession.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.liveClassSession.count({
      where: {
        status: LiveClassStatus.SCHEDULED,
        startsAt: { gte: now },
      },
    }),
    prisma.liveClassAttendance.aggregate({
      _count: { _all: true },
      _avg: {
        joinCount: true,
        totalDurationMinutes: true,
      },
    }),
    prisma.liveClassRecording.count(),
    prisma.communicationMessage.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.communicationMessage.groupBy({
      by: ["status"],
      where: { createdAt: { gte: last7Days } },
      _count: { _all: true },
    }),
    prisma.communicationMessage.findMany({
      where: { status: CommunicationStatus.FAILED },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        template: true,
        recipientEmail: true,
        updatedAt: true,
      },
    }),
    prisma.liveClassSession.findMany({
      where: { status: LiveClassStatus.CANCELLED },
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    }),
  ]);

  const totalRevenue = enrollmentsForRevenue.reduce(
    (sum, enrollment) => sum + enrollment.course.price.toNumber(),
    0
  );
  const revenue30d = enrollmentsForRevenue30d.reduce(
    (sum, enrollment) => sum + enrollment.course.price.toNumber(),
    0
  );

  const statusCount = (status: LiveClassStatus) =>
    liveClassStatusGroups.find((group) => group.status === status)?._count._all ?? 0;
  const communicationCount = (
    groups: { status: CommunicationStatus; _count: { _all: number } }[],
    status: CommunicationStatus
  ) => groups.find((group) => group.status === status)?._count._all ?? 0;

  const communicationSent7d = communicationCount(communicationGroups7d, CommunicationStatus.SENT);
  const communicationFailed7d = communicationCount(
    communicationGroups7d,
    CommunicationStatus.FAILED
  );
  const communicationTotal7d = communicationGroups7d.reduce(
    (sum, group) => sum + group._count._all,
    0
  );
  const communicationSuccessRate7d =
    communicationTotal7d > 0 ? (communicationSent7d / communicationTotal7d) * 100 : 100;

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

  const communicationActivity: ActivityItem[] = recentCommunicationFailures.map((item) => ({
    id: `communication:${item.id}`,
    type: "communication",
    message: `Communication failure on ${item.template} to ${item.recipientEmail}`,
    createdAt: item.updatedAt.toISOString(),
  }));

  const liveClassActivity: ActivityItem[] = recentLiveClassCancellations.map((item) => ({
    id: `live_class:${item.id}`,
    type: "live_class",
    message: `Live class "${item.title}" marked as cancelled`,
    createdAt: item.updatedAt.toISOString(),
  }));

  const activity = [
    ...enrollmentActivity,
    ...courseUpdateActivity,
    ...communicationActivity,
    ...liveClassActivity,
  ]
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
      kpis: {
        mrrProxy30d: revenue30d,
        onboardingCompletionRate:
          totalStudents > 0 ? (onboardingCompletedStudents / totalStudents) * 100 : 0,
        tutorApprovalRate: totalTutors > 0 ? (approvedTutors / totalTutors) * 100 : 0,
        pendingTutorApprovals: pendingTutors,
        pendingCourseSubmissions,
        upcomingLiveClasses,
        completedLiveClasses: statusCount(LiveClassStatus.COMPLETED),
        cancelledLiveClasses: statusCount(LiveClassStatus.CANCELLED),
        attendanceParticipants: attendanceAggregate._count._all,
        averageAttendanceJoins: attendanceAggregate._avg.joinCount ?? 0,
        averageAttendanceMinutes: attendanceAggregate._avg.totalDurationMinutes ?? 0,
        recordingAssets: recordingsCount,
        communicationSent: communicationCount(communicationGroups, CommunicationStatus.SENT),
        communicationFailed: communicationCount(communicationGroups, CommunicationStatus.FAILED),
        communicationPending: communicationCount(communicationGroups, CommunicationStatus.PENDING),
        communicationSent7d,
        communicationFailed7d,
        communicationSuccessRate7d,
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
