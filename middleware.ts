import { NextRequest, NextResponse } from "next/server";
import { canAccessPath } from "@/lib/auth/rbac";
import { getSessionFromRequest } from "@/lib/auth/request-session";

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
  );
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await getSessionFromRequest(req);
  const role = session?.role ?? null;

  const protectedPath =
    pathname.startsWith("/student") ||
    pathname.startsWith("/tutor") ||
    pathname.startsWith("/admin");

  if (!protectedPath) {
    return applySecurityHeaders(NextResponse.next());
  }

  if (!role) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (!canAccessPath(role, pathname)) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/unauthorized", req.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
