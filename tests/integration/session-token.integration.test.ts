import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearSessionCookieOptions,
  createSessionToken,
  sessionCookieOptions,
  verifySessionToken,
} from "../../lib/auth/session";

describe("session token integration", () => {
  const originalAuthSecret = process.env.AUTH_SESSION_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.AUTH_SESSION_SECRET = "test-session-secret";
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    if (originalAuthSecret === undefined) {
      delete process.env.AUTH_SESSION_SECRET;
    } else {
      process.env.AUTH_SESSION_SECRET = originalAuthSecret;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("creates and verifies token with expected claims", async () => {
    const token = await createSessionToken({
      id: "user_1",
      email: "student@example.com",
      role: "STUDENT",
    });

    const verified = await verifySessionToken(token);
    expect(verified).toEqual({
      id: "user_1",
      email: "student@example.com",
      role: "STUDENT",
    });
  });

  it("returns null for tampered token", async () => {
    const token = await createSessionToken({
      id: "user_2",
      email: "tutor@example.com",
      role: "TUTOR",
    });

    const verified = await verifySessionToken(`${token}tampered`);
    expect(verified).toBeNull();
  });

  it("throws when secret is missing while creating token", async () => {
    delete process.env.AUTH_SESSION_SECRET;
    process.env.NODE_ENV = "production";

    await expect(
      createSessionToken({
        id: "user_3",
        email: "admin@example.com",
        role: "ADMIN",
      })
    ).rejects.toThrow("AUTH_SESSION_SECRET is required");
  });

  it("sets secure cookies only in production mode", () => {
    process.env.NODE_ENV = "production";
    expect(sessionCookieOptions().secure).toBe(true);
    expect(clearSessionCookieOptions().secure).toBe(true);
    expect(clearSessionCookieOptions().maxAge).toBe(0);
  });
});
