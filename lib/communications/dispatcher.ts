import { CommunicationStatus, CommunicationTemplate, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logError, logInfo, logWarn } from "@/lib/observability/logger";
import { renderCommunicationTemplate } from "@/lib/communications/templates";

type DispatchInput = {
  template: CommunicationTemplate;
  recipientEmail: string;
  recipientName?: string | null;
  userId?: string | null;
  courseId?: string | null;
  liveClassSessionId?: string | null;
  triggerKey?: string | null;
  templateData?: {
    recipientName?: string | null;
    courseTitle?: string | null;
    amountLabel?: string | null;
    liveClassTitle?: string | null;
    liveClassStartsAt?: string | null;
    timezone?: string | null;
    cancellationReason?: string | null;
  };
};

type ProviderResult = {
  ok: boolean;
  provider: string;
  providerMessageId?: string | null;
  responseCode?: number | null;
  responseBody?: string | null;
  errorMessage?: string | null;
};

const MAX_ATTEMPTS = 3;

async function sendWithProvider(input: {
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  bodyText: string;
  bodyHtml?: string | null;
}): Promise<ProviderResult> {
  const webhookUrl = process.env.EMAIL_DELIVERY_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    if (process.env.NODE_ENV === "production") {
      return {
        ok: false,
        provider: "none",
        errorMessage: "EMAIL_DELIVERY_WEBHOOK_URL is not configured in production",
      };
    }
    return {
      ok: true,
      provider: "mock-local",
      providerMessageId: `mock-${Date.now()}`,
      responseCode: 200,
      responseBody: "mock-delivery",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to: {
          email: input.recipientEmail,
          name: input.recipientName ?? null,
        },
        subject: input.subject,
        bodyText: input.bodyText,
        bodyHtml: input.bodyHtml ?? null,
      }),
    });

    const body = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        provider: "webhook",
        responseCode: response.status,
        responseBody: body.slice(0, 4000),
        errorMessage: `Provider responded with status ${response.status}`,
      };
    }

    return {
      ok: true,
      provider: "webhook",
      responseCode: response.status,
      responseBody: body.slice(0, 4000),
      providerMessageId: response.headers.get("x-message-id"),
    };
  } catch (error) {
    return {
      ok: false,
      provider: "webhook",
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function dispatchCommunication(input: DispatchInput) {
  const rendered = renderCommunicationTemplate(input.template, {
    recipientName: input.templateData?.recipientName ?? input.recipientName ?? null,
    courseTitle: input.templateData?.courseTitle ?? null,
    amountLabel: input.templateData?.amountLabel ?? null,
    liveClassTitle: input.templateData?.liveClassTitle ?? null,
    liveClassStartsAt: input.templateData?.liveClassStartsAt ?? null,
    timezone: input.templateData?.timezone ?? null,
    cancellationReason: input.templateData?.cancellationReason ?? null,
  });

  const message = await prisma.communicationMessage.create({
    data: {
      template: input.template,
      triggerKey: input.triggerKey ?? null,
      status: CommunicationStatus.PENDING,
      recipientEmail: input.recipientEmail.toLowerCase(),
      recipientName: input.recipientName ?? null,
      subject: rendered.subject,
      bodyText: rendered.bodyText,
      bodyHtml: rendered.bodyHtml,
      userId: input.userId ?? null,
      courseId: input.courseId ?? null,
      liveClassSessionId: input.liveClassSessionId ?? null,
      meta: (input.templateData ?? {}) as Prisma.InputJsonValue,
    },
    select: {
      id: true,
    },
  });

  let finalStatus: CommunicationStatus = CommunicationStatus.FAILED;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await sendWithProvider({
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName ?? null,
      subject: rendered.subject,
      bodyText: rendered.bodyText,
      bodyHtml: rendered.bodyHtml,
    });

    await prisma.communicationAttempt.create({
      data: {
        messageId: message.id,
        attemptNumber: attempt,
        status: result.ok ? CommunicationStatus.SENT : CommunicationStatus.FAILED,
        provider: result.provider,
        providerMessageId: result.providerMessageId ?? null,
        responseCode: result.responseCode ?? null,
        errorMessage: result.errorMessage ?? null,
        responseBody: result.responseBody ?? null,
      },
    });

    await prisma.communicationMessage.update({
      where: { id: message.id },
      data: {
        attemptCount: attempt,
        lastAttemptAt: new Date(),
        lastError: result.errorMessage ?? null,
        status: result.ok ? CommunicationStatus.SENT : CommunicationStatus.PENDING,
        sentAt: result.ok ? new Date() : null,
      },
    });

    if (result.ok) {
      finalStatus = CommunicationStatus.SENT;
      lastError = null;
      logInfo("communication_sent", {
        messageId: message.id,
        template: input.template,
        recipientEmail: input.recipientEmail,
        attempt,
        provider: result.provider,
      });
      break;
    }

    lastError = result.errorMessage ?? "Unknown communication provider failure";
    logWarn("communication_attempt_failed", {
      messageId: message.id,
      template: input.template,
      recipientEmail: input.recipientEmail,
      attempt,
      error: lastError,
    });
  }

  if (finalStatus !== CommunicationStatus.SENT) {
    await prisma.communicationMessage.update({
      where: { id: message.id },
      data: {
        status: CommunicationStatus.FAILED,
        failedAt: new Date(),
        lastError,
      },
    });
    logError("communication_failed", {
      messageId: message.id,
      template: input.template,
      recipientEmail: input.recipientEmail,
      error: lastError,
    });
  }

  return {
    messageId: message.id,
    status: finalStatus,
    error: lastError,
  };
}
