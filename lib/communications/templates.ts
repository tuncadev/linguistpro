import { CommunicationTemplate } from "@prisma/client";

type TemplateInput = {
  recipientName?: string | null;
  courseTitle?: string | null;
  amountLabel?: string | null;
  liveClassTitle?: string | null;
  liveClassStartsAt?: string | null;
  timezone?: string | null;
  cancellationReason?: string | null;
};

type RenderedTemplate = {
  subject: string;
  bodyText: string;
  bodyHtml: string;
};

function safeName(name?: string | null): string {
  const trimmed = name?.trim();
  return trimmed || "Learner";
}

export function renderCommunicationTemplate(
  template: CommunicationTemplate,
  input: TemplateInput
): RenderedTemplate {
  const name = safeName(input.recipientName);
  const courseTitle = input.courseTitle?.trim() || "your course";
  const classTitle = input.liveClassTitle?.trim() || "your live class";
  const startsAt = input.liveClassStartsAt?.trim() || "scheduled time";
  const timezone = input.timezone?.trim() || "local timezone";
  const amount = input.amountLabel?.trim() || "payment amount";
  const reason = input.cancellationReason?.trim();

  switch (template) {
    case CommunicationTemplate.WELCOME:
      return {
        subject: "Welcome to LinguistPro",
        bodyText: `Hi ${name}, welcome to LinguistPro. Your account is now ready. Start by exploring available language courses and enroll in your first class.`,
        bodyHtml: `<p>Hi ${name},</p><p>Welcome to LinguistPro. Your account is now ready.</p><p>Start by exploring available language courses and enroll in your first class.</p>`,
      };
    case CommunicationTemplate.ENROLLMENT_CONFIRMATION:
      return {
        subject: `Enrollment confirmed: ${courseTitle}`,
        bodyText: `Hi ${name}, your enrollment in "${courseTitle}" is confirmed. You can now access the course content and upcoming sessions.`,
        bodyHtml: `<p>Hi ${name},</p><p>Your enrollment in <strong>${courseTitle}</strong> is confirmed.</p><p>You can now access the course content and upcoming sessions.</p>`,
      };
    case CommunicationTemplate.PAYMENT_RECEIPT:
      return {
        subject: `Payment receipt for ${courseTitle}`,
        bodyText: `Hi ${name}, we received your payment for "${courseTitle}". Receipt total: ${amount}.`,
        bodyHtml: `<p>Hi ${name},</p><p>We received your payment for <strong>${courseTitle}</strong>.</p><p>Receipt total: <strong>${amount}</strong>.</p>`,
      };
    case CommunicationTemplate.CLASS_REMINDER:
      return {
        subject: `Class reminder: ${classTitle}`,
        bodyText: `Hi ${name}, this is a reminder for "${classTitle}" at ${startsAt} (${timezone}).`,
        bodyHtml: `<p>Hi ${name},</p><p>This is a reminder for <strong>${classTitle}</strong> at <strong>${startsAt}</strong> (${timezone}).</p>`,
      };
    case CommunicationTemplate.CLASS_CANCELLATION:
      return {
        subject: `Class cancelled: ${classTitle}`,
        bodyText: `Hi ${name}, "${classTitle}" has been cancelled.${reason ? ` Reason: ${reason}` : ""}`,
        bodyHtml: `<p>Hi ${name},</p><p><strong>${classTitle}</strong> has been cancelled.</p>${
          reason ? `<p>Reason: ${reason}</p>` : ""
        }`,
      };
    default:
      return {
        subject: "LinguistPro notification",
        bodyText: `Hi ${name}, you have a new update from LinguistPro.`,
        bodyHtml: `<p>Hi ${name},</p><p>You have a new update from LinguistPro.</p>`,
      };
  }
}
