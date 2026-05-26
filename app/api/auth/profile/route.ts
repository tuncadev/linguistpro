import { NextRequest, NextResponse } from "next/server";
import { AbuseTargetType } from "@prisma/client";
import { z } from "zod";
import { requireAuthenticated } from "@/lib/auth/server-checks";
import { prisma } from "@/lib/prisma";
import { withApiHandler } from "@/lib/http/with-api-handler";
import { evaluateAvatarImageSafety } from "@/lib/moderation/avatar-image-safety";
import { getClientIp } from "@/lib/security/rate-limit";
import {
  getIpLockState,
  lockIpForDuration,
  permanentlyLockIp,
  unlockIp,
} from "@/lib/security/avatar-policy-ip-lock";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120).nullable().optional(),
  bio: z.string().trim().max(5000).nullable().optional(),
  // Data URL uploads are base64-encoded and can be much longer than plain links.
  avatarUrl: z.string().trim().max(3_200_000).nullable().optional(),
});

function isAllowedAvatarUrl(value: string): boolean {
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  return /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+$/.test(value);
}

const profileSelect = {
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
} as const;

const AVATAR_POLICY_REASON_PREFIX = "[AVATAR_POLICY_VIOLATION]";
const AVATAR_TEMP_BLOCK_MS = 30 * 24 * 60 * 60 * 1000;
const AVATAR_PERMANENT_BAN_UNTIL = new Date("9999-12-31T23:59:59.999Z");

function isPermanentBanLock(date: Date | null | undefined): boolean {
  if (!date) {
    return false;
  }
  return date.getTime() >= AVATAR_PERMANENT_BAN_UNTIL.getTime() - 1000;
}

async function countAvatarViolations(userId: string): Promise<number> {
  return prisma.abuseReport.count({
    where: {
      reporterId: userId,
      targetType: AbuseTargetType.USER,
      targetId: userId,
      reason: {
        startsWith: AVATAR_POLICY_REASON_PREFIX,
      },
    },
  });
}

export const GET = withApiHandler(async (req: NextRequest) => {
  const auth = await requireAuthenticated(req);
  if (auth.ok === false) {
    return auth.response;
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.session.id },
    select: profileSelect,
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ data: user });
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const auth = await requireAuthenticated(req);
  if (auth.ok === false) {
    return auth.response;
  }
  const requesterIp = getClientIp(req);
  const ipLock = getIpLockState(requesterIp);
  if (ipLock.locked) {
    const priorViolations = await countAvatarViolations(auth.session.id);
    // Recovery path: if user-level violations were cleared (manual review/unblock),
    // stale in-memory IP lock should not continue blocking settings updates.
    if (priorViolations === 0 && !ipLock.permanent) {
      unlockIp(requesterIp);
    } else {
    return NextResponse.json(
      {
        error: ipLock.permanent
          ? "IP address is permanently blocked due to repeated avatar policy violations."
          : "IP address is temporarily blocked due to avatar policy violations.",
        retryAfterSeconds: ipLock.retryAfterSeconds || undefined,
      },
      { status: 403 }
    );
    }
  }

  const accountState = await prisma.user.findUnique({
    where: { id: auth.session.id },
    select: { id: true, email: true, lockedUntil: true },
  });

  if (!accountState) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (isPermanentBanLock(accountState.lockedUntil)) {
    return NextResponse.json(
      {
        error:
          "Account is permanently banned due to repeated avatar safety policy violations.",
      },
      { status: 403 }
    );
  }

  if (accountState?.lockedUntil && accountState.lockedUntil > new Date()) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((accountState.lockedUntil.getTime() - Date.now()) / 1000)
    );
    return NextResponse.json(
      {
        error:
          "Account is temporarily blocked due to repeated avatar policy violations.",
        retryAfterSeconds,
      },
      { status: 403 }
    );
  }

  const payload = updateProfileSchema.parse(await req.json());
  const updates: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    const nextName = payload.name?.trim() ?? "";
    updates.name = nextName.length > 0 ? nextName : null;
  }

  if (payload.bio !== undefined) {
    const nextBio = payload.bio?.trim() ?? "";
    updates.bio = nextBio.length > 0 ? nextBio : null;
  }

  if (payload.avatarUrl !== undefined) {
    const nextAvatar = payload.avatarUrl?.trim() ?? "";
    if (nextAvatar.length === 0) {
      updates.avatarUrl = null;
    } else {
      if (!isAllowedAvatarUrl(nextAvatar)) {
        return NextResponse.json(
          {
            error:
              "Avatar must be a valid http(s) URL or a base64 data:image upload string.",
          },
          { status: 400 }
        );
      }

      const safety = await evaluateAvatarImageSafety(
        nextAvatar.startsWith("data:image/")
          ? { kind: "data_url", dataUrl: nextAvatar }
          : { kind: "remote_url", url: nextAvatar }
      );

      if (!safety.allowed) {
        const source = nextAvatar.startsWith("data:image/") ? "data_url" : "remote_url";
        const priorViolations = await countAvatarViolations(auth.session.id);

        if (priorViolations === 0) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: auth.session.id },
              data: {
                avatarUrl: null,
              },
            }),
            prisma.abuseReport.create({
              data: {
                reporterId: auth.session.id,
                targetType: AbuseTargetType.USER,
                targetId: auth.session.id,
                reason: `${AVATAR_POLICY_REASON_PREFIX} warning`,
                details: JSON.stringify({
                  moderationReason: safety.reason,
                  source,
                  ip: requesterIp,
                  email: accountState.email,
                  at: new Date().toISOString(),
                }),
                status: "OPEN",
              },
            }),
          ]);

          return NextResponse.json(
            {
              error:
                "Avatar rejected by safety policy. First warning issued. Avatar was removed and reset to placeholder.",
              moderationReason: safety.reason,
              warningCount: 1,
              nextPenalty: "1 month block on next violation",
            },
            { status: 400 }
          );
        }

        if (priorViolations === 1) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: auth.session.id },
              data: {
                avatarUrl: null,
                lockedUntil: new Date(Date.now() + AVATAR_TEMP_BLOCK_MS),
              },
            }),
            prisma.abuseReport.create({
              data: {
                reporterId: auth.session.id,
                targetType: AbuseTargetType.USER,
                targetId: auth.session.id,
                reason: `${AVATAR_POLICY_REASON_PREFIX} temp_block_1m`,
                details: JSON.stringify({
                  moderationReason: safety.reason,
                  source,
                  ip: requesterIp,
                  email: accountState.email,
                  at: new Date().toISOString(),
                }),
                status: "OPEN",
              },
            }),
          ]);
          lockIpForDuration(requesterIp, AVATAR_TEMP_BLOCK_MS);

          return NextResponse.json(
            {
              error:
                "Avatar rejected by safety policy. Account is blocked for 1 month after second violation.",
              moderationReason: safety.reason,
              retryAfterSeconds: Math.ceil(AVATAR_TEMP_BLOCK_MS / 1000),
            },
            { status: 403 }
          );
        }

        await prisma.$transaction([
          prisma.user.update({
            where: { id: auth.session.id },
            data: {
              avatarUrl: null,
              lockedUntil: AVATAR_PERMANENT_BAN_UNTIL,
            },
          }),
          prisma.abuseReport.create({
            data: {
              reporterId: auth.session.id,
              targetType: AbuseTargetType.USER,
              targetId: auth.session.id,
              reason: `${AVATAR_POLICY_REASON_PREFIX} permanent_ban`,
              details: JSON.stringify({
                moderationReason: safety.reason,
                source,
                ip: requesterIp,
                email: accountState.email,
                at: new Date().toISOString(),
              }),
              status: "OPEN",
            },
          }),
        ]);
        permanentlyLockIp(requesterIp);

        return NextResponse.json(
          {
            error:
              "Avatar rejected by safety policy. Account is permanently banned after repeated violations.",
            moderationReason: safety.reason,
          },
          { status: 403 }
        );
      }

      updates.avatarUrl = nextAvatar;
    }
  }

  if (Object.keys(updates).length === 0) {
    const current = await prisma.user.findUnique({
      where: { id: auth.session.id },
      select: profileSelect,
    });

    return NextResponse.json({ data: current });
  }

  const updated = await prisma.user.update({
    where: { id: auth.session.id },
    data: updates,
    select: profileSelect,
  });

  return NextResponse.json({ data: updated });
});
