import { CommunicationTemplate } from "@prisma/client";
import { dispatchCommunication } from "@/lib/communications/dispatcher";
import { prisma } from "@/lib/prisma";

export async function sendWelcomeMessage(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!user) return null;

  return dispatchCommunication({
    template: CommunicationTemplate.WELCOME,
    triggerKey: "auth.email_verified",
    userId: user.id,
    recipientEmail: user.email,
    recipientName: user.name,
    templateData: {
      recipientName: user.name,
    },
  });
}

export async function sendEnrollmentConfirmation(input: {
  studentId: string;
  courseId: string;
}) {
  const data = await prisma.enrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId: input.courseId,
        studentId: input.studentId,
      },
    },
    select: {
      student: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  if (!data) return null;

  return dispatchCommunication({
    template: CommunicationTemplate.ENROLLMENT_CONFIRMATION,
    triggerKey: "enrollment.created",
    userId: data.student.id,
    courseId: data.course.id,
    recipientEmail: data.student.email,
    recipientName: data.student.name,
    templateData: {
      recipientName: data.student.name,
      courseTitle: data.course.title,
    },
  });
}

async function getLiveClassAudience(liveClassSessionId: string) {
  const liveClass = await prisma.liveClassSession.findUnique({
    where: { id: liveClassSessionId },
    select: {
      id: true,
      title: true,
      startsAt: true,
      timezone: true,
      course: {
        select: {
          id: true,
          title: true,
          enrollments: {
            select: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return liveClass;
}

export async function sendLiveClassReminderMessages(liveClassSessionId: string) {
  const liveClass = await getLiveClassAudience(liveClassSessionId);
  if (!liveClass) return { sent: 0 };

  let sent = 0;
  for (const enrollment of liveClass.course.enrollments) {
    const student = enrollment.student;
    const result = await dispatchCommunication({
      template: CommunicationTemplate.CLASS_REMINDER,
      triggerKey: "live_class.reminder",
      userId: student.id,
      courseId: liveClass.course.id,
      liveClassSessionId: liveClass.id,
      recipientEmail: student.email,
      recipientName: student.name,
      templateData: {
        recipientName: student.name,
        liveClassTitle: liveClass.title,
        liveClassStartsAt: liveClass.startsAt.toISOString(),
        timezone: liveClass.timezone,
      },
    });
    if (result.status === "SENT") sent += 1;
  }

  return { sent };
}

export async function sendLiveClassCancellationMessages(input: {
  liveClassSessionId: string;
  reason?: string | null;
}) {
  const liveClass = await getLiveClassAudience(input.liveClassSessionId);
  if (!liveClass) return { sent: 0 };

  let sent = 0;
  for (const enrollment of liveClass.course.enrollments) {
    const student = enrollment.student;
    const result = await dispatchCommunication({
      template: CommunicationTemplate.CLASS_CANCELLATION,
      triggerKey: "live_class.cancelled",
      userId: student.id,
      courseId: liveClass.course.id,
      liveClassSessionId: liveClass.id,
      recipientEmail: student.email,
      recipientName: student.name,
      templateData: {
        recipientName: student.name,
        liveClassTitle: liveClass.title,
        cancellationReason: input.reason ?? null,
      },
    });
    if (result.status === "SENT") sent += 1;
  }

  return { sent };
}
