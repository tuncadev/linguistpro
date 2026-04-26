import { NextRequest, NextResponse } from "next/server";
import { canAccessPath, type AppRole } from "@/lib/auth/rbac";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

async function getRoleFromRequest(req: NextRequest): Promise<AppRole | null> {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const session = await verifySessionToken(token);
    if (session) {
      return session.role;
    }
  }

  // Dev fallback header. Remove after full auth rollout.
  const headerRole = req.headers.get("x-dev-role");
  if (headerRole === "STUDENT" || headerRole === "TUTOR" || headerRole === "ADMIN") {
    return headerRole;
  }

  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = await getRoleFromRequest(req);

  const protectedPath =
    pathname.startsWith("/student") ||
    pathname.startsWith("/tutor") ||
    pathname.startsWith("/admin");

  if (!protectedPath) {
    return NextResponse.next();
  }

  if (!role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/tutor/:path*", "/admin/:path*"],
};
