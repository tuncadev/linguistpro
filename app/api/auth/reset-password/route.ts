import { AuthTokenType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

const resetSchema = z.object({
  token: z.string().trim().min(1).max(256),
  password: z.string().min(8).max(72),
});

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(req, {
    key: "auth:reset-password",
    limit: 10,
    windowMs: 10 * 60 * 1000,
    blockMs: 20 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "Too many password reset attempts. Please retry later.",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const token = await consumeAuthToken(parsed.data.token, AuthTokenType.PASSWORD_RESET);
  if (!token) {
    return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: token.userId },
    data: {
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  return NextResponse.json({ message: "Password reset successful." });
}
