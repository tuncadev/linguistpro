import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthTokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { clearAuthTokensByType, issueAuthToken } from "@/lib/auth/tokens";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { normalizeLocale } from "@/i18n/routing";
import { apiMessage } from "@/lib/i18n/api-messages";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, {
      key: "auth:register",
      limit: 10,
      windowMs: 10 * 60 * 1000,
      blockMs: 20 * 60 * 1000,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: apiMessage(req, "auth.tooManyRegistrationAttempts"),
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: apiMessage(req, "auth.invalidRegistrationPayload"), details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json({ error: apiMessage(req, "auth.emailAlreadyRegistered") }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: "STUDENT",
        emailVerifiedAt: null,
        preferredLocale: normalizeLocale(req.headers.get("x-next-intl-locale")),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerifiedAt: true,
        onboardingCompletedAt: true,
        tutorApprovalStatus: true,
        tutorApprovedAt: true,
        tutorApprovalNotes: true,
        preferredLocale: true,
        avatarUrl: true,
        bio: true,
        rating: true,
        studentCount: true,
        coursesAuthored: true,
        location: true,
        languagesSpoken: true,
        profileHighlights: true,
        profileStats: true,
        pedagogicalModules: true,
      },
    });

    await clearAuthTokensByType(user.id, AuthTokenType.EMAIL_VERIFY);
    const verificationToken = await issueAuthToken(user.id, {
      type: AuthTokenType.EMAIL_VERIFY,
      ttlMinutes: 24 * 60,
    });

    return NextResponse.json(
      {
        message: apiMessage(req, "auth.registrationSuccessful"),
        verificationRequired: true,
        verificationToken: process.env.NODE_ENV === "production" ? undefined : verificationToken,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json({ error: apiMessage(req, "auth.registrationFailed") }, { status: 500 });
  }
}
