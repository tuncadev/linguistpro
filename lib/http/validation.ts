import { NextRequest } from "next/server";
import { z } from "zod";
import { badRequest } from "@/lib/http/api-error";

export async function parseJsonBody<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    badRequest("Invalid JSON body");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    badRequest("Invalid request payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseQuery<TSchema extends z.ZodTypeAny>(
  req: NextRequest,
  schema: TSchema
): z.infer<TSchema> {
  const parsed = schema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );
  if (!parsed.success) {
    badRequest("Invalid query parameters", parsed.error.flatten());
  }
  return parsed.data;
}

