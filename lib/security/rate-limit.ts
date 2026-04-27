import { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
  blockedUntil: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  blockMs?: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

const memoryStore = new Map<string, RateLimitEntry>();

function getEntry(identifier: string, now: number, windowMs: number): RateLimitEntry {
  const existing = memoryStore.get(identifier);
  if (!existing) {
    const nextEntry: RateLimitEntry = {
      count: 0,
      windowStartedAt: now,
      blockedUntil: 0,
    };
    memoryStore.set(identifier, nextEntry);
    return nextEntry;
  }

  if (now - existing.windowStartedAt >= windowMs) {
    existing.count = 0;
    existing.windowStartedAt = now;
  }

  return existing;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export function checkRateLimit(req: NextRequest, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const ip = getClientIp(req);
  const identifier = `${options.key}:${ip}`;
  const entry = getEntry(identifier, now, options.windowMs);

  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  entry.count += 1;

  if (entry.count > options.limit) {
    const blockMs = options.blockMs ?? options.windowMs;
    entry.blockedUntil = now + blockMs;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(blockMs / 1000),
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - entry.count),
    retryAfterSeconds: 0,
  };
}

export function resetRateLimitStoreForTests(): void {
  memoryStore.clear();
}
