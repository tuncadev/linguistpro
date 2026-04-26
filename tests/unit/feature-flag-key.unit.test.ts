import { describe, expect, it } from "vitest";
import { isValidFeatureFlagKey, normalizeFeatureFlagKey } from "../../lib/feature-flags/key";

describe("feature flag key helpers", () => {
  it("normalizes keys to lowercase and trims whitespace", () => {
    expect(normalizeFeatureFlagKey("  Billing_V1  ")).toBe("billing_v1");
  });

  it("accepts keys with lowercase letters, numbers, dot, dash, underscore", () => {
    expect(isValidFeatureFlagKey("billing_v1")).toBe(true);
    expect(isValidFeatureFlagKey("email.workflows-v1")).toBe(true);
  });

  it("rejects invalid formats", () => {
    expect(isValidFeatureFlagKey("a")).toBe(false);
    expect(isValidFeatureFlagKey("Billing_V1")).toBe(true);
    expect(isValidFeatureFlagKey("_badflag")).toBe(false);
    expect(isValidFeatureFlagKey("bad flag")).toBe(false);
  });
});

