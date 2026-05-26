import { prisma } from "@/lib/prisma";
import { normalizeFeatureFlagKey } from "@/lib/feature-flags/key";

export async function isFeatureEnabled(key: string, fallback = false): Promise<boolean> {
  const normalizedKey = normalizeFeatureFlagKey(key);
  if (!normalizedKey) {
    return fallback;
  }

  const flag = await prisma.featureFlag.findUnique({
    where: { key: normalizedKey },
    select: { enabled: true },
  });

  if (!flag) {
    return fallback;
  }

  return flag.enabled;
}

