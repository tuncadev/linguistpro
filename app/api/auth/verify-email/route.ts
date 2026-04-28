import { AuthTokenType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { sendWelcomeMessage } from "@/lib/communications/workflows";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/security/rate-limit";

const verifySchema = z.object({
  token: z.string().trim().min(1).max(256),
});

export async function POST(req: NextRequest) {
  const rate = checkRateLimit(req, {
    key: "auth:verify-email",
    limit: 20,
    windowMs: 10 * 60 * 1000,
    blockMs: 10 * 60 * 1000,
  });

  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: "Too many verification attempts. Please retry later.",
        retryAfterSeconds: rate.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const token = await consumeAuthToken(parsed.data.token, AuthTokenType.EMAIL_VERIFY);
  if (!token) {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: token.userId },
    data: { emailVerifiedAt: new Date() },
  });

  void sendWelcomeMessage(token.userId).catch((error) => {
    console.error("welcome communication error", error);
  });

  return NextResponse.json({ message: "Email verification successful." });
}
