const FEATURE_FLAG_KEY_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}$/;

export function normalizeFeatureFlagKey(rawKey: string): string {
  return rawKey.trim().toLowerCase();
}

export function isValidFeatureFlagKey(rawKey: string): boolean {
  return FEATURE_FLAG_KEY_PATTERN.test(normalizeFeatureFlagKey(rawKey));
}

