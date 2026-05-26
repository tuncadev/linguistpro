import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuthenticated } from "@/lib/auth/server-checks";
import {
  createSessionToken,
  isHttpsRequest,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { DEFAULT_LOCALE, normalizeLocale, SUPPORTED_LOCALES } from "@/i18n/routing";
import { apiMessage } from "@/lib/i18n/api-messages";

const localeSchema = z.object({
  locale: z.enum(["uk", "en", "es", "tr", "ru"]),
});

export async function GET(req: NextRequest) {
  const auth = await requireAuthenticated(req);
  if (auth.ok === false) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      preferredLocale: true,
      avatarUrl: true,
      bio: true,
      rating: true,
      studentCount: true,
      coursesAuthored: true,
      emailVerifiedAt: true,
      onboardingCompletedAt: true,
      tutorApprovalStatus: true,
      tutorApprovedAt: true,
      tutorApprovalNotes: true,
      location: true,
      languagesSpoken: true,
      profileHighlights: true,
      profileStats: true,
      pedagogicalModules: true,
    },
  });

  const locale = normalizeLocale(
    user?.preferredLocale ?? req.cookies.get("NEXT_LOCALE")?.value ?? auth.session.preferredLocale ?? DEFAULT_LOCALE
  );

  return NextResponse.json({
    locale,
    supportedLocales: SUPPORTED_LOCALES,
    user,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuthenticated(req);
  if (auth.ok === false) {
    return auth.response;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: apiMessage(req, "auth.invalidLocalePayload") }, { status: 400 });
  }

  const parsed = localeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: apiMessage(req, "auth.invalidLocalePayload"), details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const locale = parsed.data.locale;

  const user = await prisma.user.update({
    where: { id: auth.session.id },
    data: { preferredLocale: locale },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      preferredLocale: true,
      avatarUrl: true,
      bio: true,
      rating: true,
      studentCount: true,
      coursesAuthored: true,
      emailVerifiedAt: true,
      onboardingCompletedAt: true,
      tutorApprovalStatus: true,
      tutorApprovedAt: true,
      tutorApprovalNotes: true,
      location: true,
      languagesSpoken: true,
      profileHighlights: true,
      profileStats: true,
      pedagogicalModules: true,
    },
  });

  const token = await createSessionToken({
    id: auth.session.id,
    email: auth.session.email,
    role: auth.session.role,
    preferredLocale: locale,
  });

  const res = NextResponse.json({
    message: apiMessage(req, "auth.localeUpdated"),
    locale,
    user,
  });

  res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(isHttpsRequest(req)));
  res.cookies.set("NEXT_LOCALE", locale, {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}
