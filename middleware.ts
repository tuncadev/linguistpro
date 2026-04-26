import { NextRequest, NextResponse } from "next/server";
import { canAccessPath, type AppRole } from "@/lib/auth/rbac";

function getRoleFromRequest(req: NextRequest): AppRole | null {
  // TODO: replace with auth provider session/token role extraction.
  const headerRole = req.headers.get("x-dev-role");
  if (headerRole === "STUDENT" || headerRole === "TUTOR" || headerRole === "ADMIN") {
    return headerRole;
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const role = getRoleFromRequest(req);

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

