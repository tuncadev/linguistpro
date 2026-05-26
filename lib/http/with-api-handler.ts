import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/http/api-error";
import { reportError } from "@/lib/observability/error-tracker";
import { recordApiRequest } from "@/lib/observability/metrics";
import { logInfo, logWarn } from "@/lib/observability/logger";

type Handler<TContext = unknown> = (
  req: NextRequest,
  context: TContext
) => Promise<Response | NextResponse>;

function normalizeError(error: unknown) {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details ?? null,
        },
      },
    };
  }

  if (error instanceof z.ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.flatten(),
        },
      },
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return {
        status: 409,
        body: {
          error: {
            code: "UNIQUE_CONSTRAINT",
            message: "Resource already exists",
            details: { target: error.meta?.target ?? null },
          },
        },
      };
    }

    if (error.code === "P2025") {
      return {
        status: 404,
        body: {
          error: {
            code: "NOT_FOUND",
            message: "Resource not found",
            details: null,
          },
        },
      };
    }
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        details: null,
      },
    },
  };
}

export function withApiHandler<TContext = unknown>(handler: Handler<TContext>) {
  return async (req: NextRequest, context: TContext) => {
    const requestId = req.headers.get("x-request-id")?.trim() || crypto.randomUUID();
    const method = req.method;
    const path = req.nextUrl.pathname;
    const startedAt = Date.now();

    try {
      const response = await handler(req, context);
      const durationMs = Date.now() - startedAt;

      recordApiRequest({
        method,
        path,
        status: response.status,
        durationMs,
      });

      if (response.status >= 400) {
        logWarn("api_request_completed", {
          requestId,
          method,
          path,
          status: response.status,
          durationMs,
        });
      } else {
        logInfo("api_request_completed", {
          requestId,
          method,
          path,
          status: response.status,
          durationMs,
        });
      }

      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      const normalized = normalizeError(error);
      const durationMs = Date.now() - startedAt;

      recordApiRequest({
        method,
        path,
        status: normalized.status,
        durationMs,
      });

      if (normalized.status >= 500) {
        await reportError(error, {
          requestId,
          method,
          path,
          status: normalized.status,
          durationMs,
        });
      } else {
        logWarn("api_request_failed", {
          requestId,
          method,
          path,
          status: normalized.status,
          durationMs,
          code: normalized.body.error.code,
        });
      }

      const response = NextResponse.json(
        {
          ...normalized.body,
          requestId,
        },
        { status: normalized.status }
      );
      response.headers.set("x-request-id", requestId);
      return response;
    }
  };
}
