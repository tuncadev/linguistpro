import { cookies, headers } from "next/headers";
import type { AppRole } from "@/lib/auth/rbac";
import { SESSION_COOKIE_NAME, type SessionUser, verifySessionToken } from "@/lib/auth/session";

function parseDevHeaderRole(headerRole: string | null): AppRole | null {
  if (headerRole === "STUDENT" || headerRole === "TUTOR" || headerRole === "ADMIN") {
    return headerRole;
  }
  return null;
}

export async function getServerSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      return session;
    }
  }

  if (process.env.AUTH_ALLOW_DEV_ROLE_HEADER === "true") {
    const headerStore = await headers();
    const role = parseDevHeaderRole(headerStore.get("x-dev-role"));
    if (role) {
      return {
        id: "dev-header-user",
        email: headerStore.get("x-dev-email") ?? "dev@local.test",
        role,
      };
    }
  }

  return null;
}
