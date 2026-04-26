import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ApiError } from "@/lib/http/api-error";

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
    try {
      return await handler(req, context);
    } catch (error) {
      const normalized = normalizeError(error);
      if (normalized.status >= 500) {
        console.error("api handler error", error);
      }
      return NextResponse.json(normalized.body, { status: normalized.status });
    }
  };
}

