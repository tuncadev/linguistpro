import { logError } from "@/lib/observability/logger";

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ?? null,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
    stack: null,
  };
}

export async function reportError(
  error: unknown,
  context: {
    requestId: string;
    method: string;
    path: string;
    status: number;
    durationMs: number;
  }
) {
  const serializedError = serializeError(error);

  logError("api_error", {
    requestId: context.requestId,
    method: context.method,
    path: context.path,
    status: context.status,
    durationMs: context.durationMs,
    error: serializedError,
  });

  const webhookUrl = process.env.OBSERVABILITY_ERROR_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: "api_error",
        timestamp: new Date().toISOString(),
        ...context,
        error: serializedError,
      }),
    });
  } catch (webhookError) {
    logError("error_webhook_failed", {
      requestId: context.requestId,
      reason:
        webhookError instanceof Error ? webhookError.message : String(webhookError),
    });
  }
}
