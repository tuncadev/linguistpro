import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sealSecret, unsealSecret } from "../../lib/security/sealed-secrets";

describe("sealed secrets", () => {
  const originalKey = process.env.INTEGRATION_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.INTEGRATION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.INTEGRATION_ENCRYPTION_KEY;
    } else {
      process.env.INTEGRATION_ENCRYPTION_KEY = originalKey;
    }
  });

  it("round-trips sealed values", () => {
    const plain = "zoom-refresh-token-value";
    const sealed = sealSecret(plain);
    const unsealed = unsealSecret(sealed);

    expect(unsealed).toBe(plain);
    expect(sealed).not.toBe(plain);
  });

  it("rejects malformed payload", () => {
    expect(() => unsealSecret("invalid")).toThrow();
  });
});
