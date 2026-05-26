import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRoles } from "@/lib/auth/server-checks";
import { badRequest, notFound } from "@/lib/http/api-error";
import { parseJsonBody } from "@/lib/http/validation";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { prisma } from "@/lib/prisma";
import { isValidFeatureFlagKey, normalizeFeatureFlagKey } from "@/lib/feature-flags/key";
import { serializeFeatureFlag } from "@/lib/feature-flags/serialize";

const updateFeatureFlagSchema = z
  .object({
    description: z.string().trim().max(1000).nullable().optional(),
    enabled: z.boolean().optional(),
  })
  .refine((value) => value.description !== undefined || value.enabled !== undefined, {
    message: "At least one field must be provided",
  });

type Params = {
  params: Promise<{ key: string }>;
};

function parseFlagKey(rawKey: string): string {
  const normalizedKey = normalizeFeatureFlagKey(rawKey);
  if (!isValidFeatureFlagKey(normalizedKey)) {
    badRequest("Invalid feature flag key format");
  }
  return normalizedKey;
}

export const GET = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const { key } = await params;
  const normalizedKey = parseFlagKey(key);
  const flag = await prisma.featureFlag.findUnique({
    where: { key: normalizedKey },
  });

  if (!flag) {
    notFound("Feature flag not found");
  }

  return NextResponse.json({ data: serializeFeatureFlag(flag) });
});

export const PATCH = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const { key } = await params;
  const normalizedKey = parseFlagKey(key);
  const payload = await parseJsonBody(req, updateFeatureFlagSchema);

  const existing = await prisma.featureFlag.findUnique({
    where: { key: normalizedKey },
    select: { id: true },
  });
  if (!existing) {
    notFound("Feature flag not found");
  }

  const updated = await prisma.featureFlag.update({
    where: { key: normalizedKey },
    data: {
      description: payload.description,
      enabled: payload.enabled,
    },
  });

  return NextResponse.json({ data: serializeFeatureFlag(updated) });
});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: Params) => {
  const auth = await requireRoles(req, ["ADMIN"]);
  if (auth.ok === false) {
    return auth.response;
  }

  const { key } = await params;
  const normalizedKey = parseFlagKey(key);

  const existing = await prisma.featureFlag.findUnique({
    where: { key: normalizedKey },
    select: { id: true },
  });
  if (!existing) {
    notFound("Feature flag not found");
  }

  await prisma.featureFlag.delete({
    where: { key: normalizedKey },
  });

  return NextResponse.json({ deleted: true, key: normalizedKey });
});

