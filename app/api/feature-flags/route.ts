import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { badRequest } from "@/lib/http/api-error";
import { parseQuery } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { isValidFeatureFlagKey, normalizeFeatureFlagKey } from "@/lib/feature-flags/key";

const querySchema = z.object({
  keys: z.string().trim().optional(),
  includeDisabled: z.coerce.boolean().optional(),
});

function parseKeys(rawKeys?: string): string[] | undefined {
  if (!rawKeys) {
    return undefined;
  }

  const parsed = rawKeys
    .split(",")
    .map((key) => normalizeFeatureFlagKey(key))
    .filter(Boolean);

  for (const key of parsed) {
    if (!isValidFeatureFlagKey(key)) {
      badRequest("Invalid feature flag key format");
    }
  }

  return parsed.length ? parsed : undefined;
}

export const GET = withApiHandler(async (req: NextRequest) => {
  const query = parseQuery(req, querySchema);
  const keys = parseKeys(query.keys);

  const flags = await prisma.featureFlag.findMany({
    where: {
      key: keys ? { in: keys } : undefined,
      enabled: query.includeDisabled ? undefined : true,
    },
    orderBy: { key: "asc" },
    select: {
      key: true,
      enabled: true,
      updatedAt: true,
    },
  });

  const data = Object.fromEntries(flags.map((flag) => [flag.key, flag.enabled]));

  return NextResponse.json({
    data,
    meta: {
      count: flags.length,
      includeDisabled: query.includeDisabled ?? false,
      updatedAt: flags[0]?.updatedAt.toISOString() ?? null,
    },
  });
});

