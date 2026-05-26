import { NextRequest, NextResponse } from "next/server";
import { canAccessPath } from "@/lib/auth/rbac";
import { getSessionFromRequest } from "@/lib/auth/request-session";
import {
  DEFAULT_LOCALE,
  type AppLocale,
  normalizeLocale,
} from "@/i18n/routing";
import {
  extractLocaleFromPathname,
  localizePath,
  LOCALE_COOKIE_NAME,
  stripLocalePrefix,
} from "@/i18n/locale-path";

function applySecurityHeaders(response: NextResponse): NextResponse {
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? "script-src 'self' https://cdn.tailwindcss.com 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' https://cdn.tailwindcss.com 'unsafe-inline'";

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data: https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`
  );
  return response;
}

const PUBLIC_FILE = /\.(?:[a-zA-Z0-9]+)$/;

function isBypassPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    PUBLIC_FILE.test(pathname)
  );
}

function withLocaleHeader(req: NextRequest, locale: AppLocale): Headers {
  const headers = new Headers(req.headers);
  headers.set("x-next-intl-locale", locale);
  return headers;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isBypassPath(pathname)) {
    return applySecurityHeaders(NextResponse.next());
  }

  const session = await getSessionFromRequest(req);
  const role = session?.role ?? null;
  const pathLocale = extractLocaleFromPathname(pathname);
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value ?? null;
  const profileLocale = session?.preferredLocale ?? null;
  const resolvedLocale = normalizeLocale(pathLocale ?? profileLocale ?? cookieLocale ?? DEFAULT_LOCALE);

  if (pathname === "/") {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/${resolvedLocale}`;
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  if (!pathLocale && !pathname.startsWith("/api")) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = localizePath(pathname, resolvedLocale);
    return applySecurityHeaders(NextResponse.redirect(redirectUrl));
  }

  const internalPathname = pathLocale ? stripLocalePrefix(pathname) : pathname;

  const protectedPath =
    internalPathname.startsWith("/student") ||
    internalPathname.startsWith("/tutor") ||
    internalPathname.startsWith("/admin");

  if (protectedPath && !role) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = `/${resolvedLocale}/login`;
    loginUrl.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  if (protectedPath && !canAccessPath(role, internalPathname)) {
    const unauthorizedUrl = req.nextUrl.clone();
    unauthorizedUrl.pathname = `/${resolvedLocale}/unauthorized`;
    return applySecurityHeaders(NextResponse.redirect(unauthorizedUrl));
  }

  if (!pathLocale) {
    return applySecurityHeaders(NextResponse.next());
  }

  const rewriteUrl = req.nextUrl.clone();
  rewriteUrl.pathname = internalPathname;
  const rewrite = NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: withLocaleHeader(req, resolvedLocale),
    },
  });
  rewrite.cookies.set(LOCALE_COOKIE_NAME, resolvedLocale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  return applySecurityHeaders(rewrite);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
