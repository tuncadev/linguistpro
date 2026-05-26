import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { badRequest, conflict } from "@/lib/http/api-error";
import { parseJsonBody, parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { isValidFeatureFlagKey, normalizeFeatureFlagKey } from "@/lib/feature-flags/key";
import { serializeFeatureFlag } from "@/lib/feature-flags/serialize";

const listQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  take: z.coerce.number().int().min(1).max(200).optional(),
  skip: z.coerce.number().int().min(0).optional(),
});

const createFeatureFlagSchema = z.object({
  key: z.string().trim().min(2).max(64),
  description: z.string().trim().max(1000).optional(),
  enabled: z.boolean().optional(),
});

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const query = parseQuery(req, listQuerySchema);
  const normalizedQuery = query.q ? normalizeFeatureFlagKey(query.q) : undefined;

  const flags = await prisma.featureFlag.findMany({
    where: normalizedQuery
      ? {
          OR: [
            { key: { contains: normalizedQuery, mode: "insensitive" } },
            { description: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { key: "asc" },
    take: query.take ?? 100,
    skip: query.skip ?? 0,
  });

  return NextResponse.json({
    data: flags.map(serializeFeatureFlag),
    meta: {
      count: flags.length,
      take: query.take ?? 100,
      skip: query.skip ?? 0,
    },
  });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const payload = await parseJsonBody(req, createFeatureFlagSchema);
  const normalizedKey = normalizeFeatureFlagKey(payload.key);

  if (!isValidFeatureFlagKey(normalizedKey)) {
    badRequest("Invalid feature flag key format");
  }

  const existing = await prisma.featureFlag.findUnique({
    where: { key: normalizedKey },
    select: { id: true },
  });

  if (existing) {
    conflict("Feature flag already exists");
  }

  const created = await prisma.featureFlag.create({
    data: {
      key: normalizedKey,
      description: payload.description || null,
      enabled: payload.enabled ?? false,
    },
  });

  return NextResponse.json({ data: serializeFeatureFlag(created) }, { status: 201 });
});

