import type { FeatureFlag } from "@prisma/client";

export function serializeFeatureFlag(flag: FeatureFlag) {
  return {
    id: flag.id,
    key: flag.key,
    description: flag.description,
    enabled: flag.enabled,
    createdAt: flag.createdAt.toISOString(),
    updatedAt: flag.updatedAt.toISOString(),
  };
}

