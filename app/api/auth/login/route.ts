import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  try {
    const rate = checkRateLimit(req, {
      key: "auth:login",
      limit: 20,
      windowMs: 10 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    });

    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please retry later.",
          retryAfterSeconds: rate.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid login payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        emailVerifiedAt: true,
        onboardingCompletedAt: true,
        tutorApprovalStatus: true,
        tutorApprovedAt: true,
        tutorApprovalNotes: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
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

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const retryAfterSeconds = Math.max(1, Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000));
      return NextResponse.json(
        { error: "Account is temporarily locked due to failed login attempts", retryAfterSeconds },
        { status: 423 }
      );
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      const nextAttempts = (user.failedLoginAttempts ?? 0) + 1;
      const shouldLock = nextAttempts >= 5;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : nextAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          error: "Email verification required before sign in",
          verificationRequired: true,
        },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
        onboardingCompletedAt: user.onboardingCompletedAt,
        tutorApprovalStatus: user.tutorApprovalStatus,
        tutorApprovedAt: user.tutorApprovedAt,
        tutorApprovalNotes: user.tutorApprovalNotes,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        rating: user.rating,
        studentCount: user.studentCount,
        coursesAuthored: user.coursesAuthored,
        location: user.location,
        languagesSpoken: user.languagesSpoken,
        profileHighlights: user.profileHighlights,
        profileStats: user.profileStats,
        pedagogicalModules: user.pedagogicalModules,
      },
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions());
    return res;
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
