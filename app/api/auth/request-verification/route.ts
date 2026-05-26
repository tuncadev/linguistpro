import { AuthTokenType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { clearAuthTokensByType, issueAuthToken } from "@/lib/auth/tokens";
import { checkRateLimit } from "@/lib/security/rate-limit";

const requestSchema = z.object({
  email: z.string().trim().email().max(255),
});

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(req, {
    key: "auth:request-verification",
    limit: 10,
    windowMs: 10 * 60 * 1000,
    blockMs: 20 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "Too many verification requests. Please retry later.",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true },
  });

  if (!user) {
    return NextResponse.json({ message: "If the account exists, a verification link was generated." });
  }

  if (user.emailVerifiedAt) {
    return NextResponse.json({ message: "Email is already verified." });
  }

  await clearAuthTokensByType(user.id, AuthTokenType.EMAIL_VERIFY);
  const verificationToken = await issueAuthToken(user.id, {
    type: AuthTokenType.EMAIL_VERIFY,
    ttlMinutes: 24 * 60,
  });

  return NextResponse.json({
    message: "Verification token generated.",
    verificationToken: process.env.NODE_ENV === "production" ? undefined : verificationToken,
  });
}
