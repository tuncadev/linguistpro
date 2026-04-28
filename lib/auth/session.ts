import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/lib/auth/constants";
import type { AppRole } from "@/lib/auth/rbac";

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
};

type SessionClaims = {
  sub: string;
  email: string;
  role: AppRole;
};

function getSessionSecret(): Uint8Array {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV !== "production") {
    return new TextEncoder().encode("linguistpro-dev-session-secret-insecure");
  }

  throw new Error("AUTH_SESSION_SECRET is required");
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret());
    const claims = payload as SessionClaims;

    if (!claims.sub || !claims.email || !claims.role) {
      return null;
    }

    if (claims.role !== "STUDENT" && claims.role !== "TUTOR" && claims.role !== "ADMIN") {
      return null;
    }

    return {
      id: claims.sub,
      email: claims.email,
      role: claims.role,
    };
  } catch {
    return null;
  }
}

function normalizeProto(raw: string | null | undefined): string {
  return raw?.split(",")[0]?.trim().toLowerCase() ?? "";
}

export function isHttpsRequest(req: NextRequest): boolean {
  const forwardedProto = normalizeProto(req.headers.get("x-forwarded-proto"));
  if (forwardedProto) {
    return forwardedProto === "https";
  }
  return req.nextUrl.protocol === "https:";
}

function resolveCookieSecureFlag(isHttps: boolean): boolean {
  const override = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (override === "true") {
    return true;
  }
  if (override === "false") {
    return false;
  }
  return process.env.NODE_ENV === "production" ? isHttps : false;
}

export function sessionCookieOptions(isHttps: boolean) {
  return {
    httpOnly: true,
    secure: resolveCookieSecureFlag(isHttps),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function clearSessionCookieOptions(isHttps: boolean) {
  return {
    httpOnly: true,
    secure: resolveCookieSecureFlag(isHttps),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export { SESSION_COOKIE_NAME };
