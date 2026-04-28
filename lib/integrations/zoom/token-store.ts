import { notFound } from "@/lib/http/api-error";
import { prisma } from "@/lib/prisma";
import { sealSecret, unsealSecret } from "@/lib/security/sealed-secrets";
import { fetchZoomUserProfile, refreshZoomToken, type ZoomTokenResponse } from "@/lib/integrations/zoom/oauth";

const REFRESH_THRESHOLD_SECONDS = 120;

export function shouldRefreshZoomToken(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() - now.getTime() <= REFRESH_THRESHOLD_SECONDS * 1000;
}

function tokenExpiresAt(expiresIn: number): Date {
  return new Date(Date.now() + Math.max(30, expiresIn) * 1000);
}

export async function upsertZoomConnectionFromToken(input: {
  userId: string;
  token: ZoomTokenResponse;
}) {
  const profile = await fetchZoomUserProfile(input.token.access_token);

  return prisma.zoomConnection.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      zoomUserId: profile.id,
      zoomAccountId: profile.account_id ?? null,
      zoomEmail: profile.email ?? null,
      accessTokenEnc: sealSecret(input.token.access_token),
      refreshTokenEnc: sealSecret(input.token.refresh_token),
      tokenType: input.token.token_type ?? null,
      scope: input.token.scope ?? null,
      expiresAt: tokenExpiresAt(input.token.expires_in),
      connectedAt: new Date(),
      lastRefreshedAt: new Date(),
      revokedAt: null,
    },
    update: {
      zoomUserId: profile.id,
      zoomAccountId: profile.account_id ?? null,
      zoomEmail: profile.email ?? null,
      accessTokenEnc: sealSecret(input.token.access_token),
      refreshTokenEnc: sealSecret(input.token.refresh_token),
      tokenType: input.token.token_type ?? null,
      scope: input.token.scope ?? null,
      expiresAt: tokenExpiresAt(input.token.expires_in),
      lastRefreshedAt: new Date(),
      revokedAt: null,
    },
    select: {
      id: true,
      userId: true,
      zoomUserId: true,
      zoomAccountId: true,
      zoomEmail: true,
      expiresAt: true,
      tokenType: true,
      scope: true,
      connectedAt: true,
      lastRefreshedAt: true,
      revokedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getZoomConnectionStatusForUser(userId: string) {
  const record = await prisma.zoomConnection.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      zoomUserId: true,
      zoomAccountId: true,
      zoomEmail: true,
      tokenType: true,
      scope: true,
      expiresAt: true,
      connectedAt: true,
      lastRefreshedAt: true,
      revokedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!record) {
    return {
      connected: false,
      needsRefresh: false,
      connection: null,
    };
  }

  return {
    connected: !record.revokedAt,
    needsRefresh: shouldRefreshZoomToken(record.expiresAt),
    connection: {
      ...record,
      expiresAt: record.expiresAt.toISOString(),
      connectedAt: record.connectedAt.toISOString(),
      lastRefreshedAt: record.lastRefreshedAt?.toISOString() ?? null,
      revokedAt: record.revokedAt?.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    },
  };
}

export async function getZoomAccessTokenForUser(input: {
  userId: string;
}): Promise<string> {
  const connection = await prisma.zoomConnection.findUnique({
    where: { userId: input.userId },
    select: {
      id: true,
      userId: true,
      accessTokenEnc: true,
      refreshTokenEnc: true,
      expiresAt: true,
      revokedAt: true,
      zoomUserId: true,
      tokenType: true,
      scope: true,
    },
  });

  if (!connection || connection.revokedAt) {
    notFound("Zoom connection not found");
  }

  if (!shouldRefreshZoomToken(connection.expiresAt)) {
    return unsealSecret(connection.accessTokenEnc);
  }

  const refreshed = await refreshZoomToken(unsealSecret(connection.refreshTokenEnc));
  const refreshedAccessToken = refreshed.access_token;
  const refreshedRefreshToken = refreshed.refresh_token;
  const refreshedExpiresAt = tokenExpiresAt(refreshed.expires_in);

  await prisma.zoomConnection.update({
    where: { id: connection.id },
    data: {
      accessTokenEnc: sealSecret(refreshedAccessToken),
      refreshTokenEnc: sealSecret(refreshedRefreshToken),
      expiresAt: refreshedExpiresAt,
      lastRefreshedAt: new Date(),
      tokenType: refreshed.token_type ?? connection.tokenType ?? null,
      scope: refreshed.scope ?? connection.scope ?? null,
      revokedAt: null,
    },
  });

  return refreshedAccessToken;
}
