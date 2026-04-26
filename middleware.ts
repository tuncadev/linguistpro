import { NextRequest, NextResponse } from "next/server";
import { canAccessPath } from "@/lib/auth/rbac";
import { getSessionFromRequest } from "@/lib/auth/request-session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await getSessionFromRequest(req);
  const role = session?.role ?? null;

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
