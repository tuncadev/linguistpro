import { NextRequest } from "next/server";
import type { AppRole } from "@/lib/auth/rbac";
import { SESSION_COOKIE_NAME, type SessionUser, verifySessionToken } from "@/lib/auth/session";

function parseDevHeaderRole(req: NextRequest): AppRole | null {
  if (process.env.AUTH_ALLOW_DEV_ROLE_HEADER !== "true") {
    return null;
  }

  const headerRole = req.headers.get("x-dev-role");
  if (headerRole === "STUDENT" || headerRole === "TUTOR" || headerRole === "ADMIN") {
    return headerRole;
  }

  return null;
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      return session;
    }
  }

  const devRole = parseDevHeaderRole(req);
  if (devRole) {
    return {
      id: "dev-header-user",
      email: req.headers.get("x-dev-email") ?? "dev@local.test",
      role: devRole,
    };
  }

  return null;
}

