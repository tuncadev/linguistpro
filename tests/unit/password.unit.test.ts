import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../lib/auth/password";

describe("password hashing", () => {
  it("hashes password and verifies successfully", async () => {
    const plainPassword = "StrongPass!123";
    const passwordHash = await hashPassword(plainPassword);

    expect(passwordHash).not.toBe(plainPassword);
    await expect(verifyPassword(plainPassword, passwordHash)).resolves.toBe(true);
  });

  it("rejects wrong password", async () => {
    const passwordHash = await hashPassword("StrongPass!123");
    await expect(verifyPassword("WrongPass!456", passwordHash)).resolves.toBe(false);
  });
});
