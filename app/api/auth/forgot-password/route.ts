import { AuthTokenType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { clearAuthTokensByType, issueAuthToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

const forgotSchema = z.object({
  email: z.string().trim().email().max(255),
});

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(req, {
    key: "auth:forgot-password",
    limit: 10,
    windowMs: 10 * 60 * 1000,
    blockMs: 20 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "Too many password reset requests. Please retry later.",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ message: "If the account exists, a reset token was generated." });
  }

  await clearAuthTokensByType(user.id, AuthTokenType.PASSWORD_RESET);
  const resetToken = await issueAuthToken(user.id, {
    type: AuthTokenType.PASSWORD_RESET,
    ttlMinutes: 30,
  });

  return NextResponse.json({
    message: "Reset token generated.",
    resetToken: process.env.NODE_ENV === "production" ? undefined : resetToken,
  });
}
