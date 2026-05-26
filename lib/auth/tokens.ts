import { AuthTokenType } from "@prisma/client";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

type TokenConfig = {
  type: AuthTokenType;
  ttlMinutes: number;
};

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function issueAuthToken(userId: string, config: TokenConfig): Promise<string> {
  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + config.ttlMinutes * 60 * 1000);

  await prisma.authToken.create({
    data: {
      userId,
      type: config.type,
      tokenHash,
      expiresAt,
    },
  });

  return rawToken;
}

export async function consumeAuthToken(rawToken: string, type: AuthTokenType) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const token = await prisma.authToken.findFirst({
    where: {
      tokenHash,
      type,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      consumedAt: true,
    },
  });

  if (!token) {
    return null;
  }

  await prisma.authToken.update({
    where: { id: token.id },
    data: { consumedAt: now },
  });

  return {
    id: token.id,
    userId: token.userId,
    expiresAt: token.expiresAt,
  };
}

export async function clearAuthTokensByType(userId: string, type: AuthTokenType): Promise<void> {
  await prisma.authToken.deleteMany({
    where: {
      userId,
      type,
      consumedAt: null,
    },
  });
}
