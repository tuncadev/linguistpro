const ipLockStore = new Map<string, number>();

const PERMANENT_LOCK_TS = Number.MAX_SAFE_INTEGER;

export function lockIpForDuration(ip: string, durationMs: number): void {
  if (!ip) {
    return;
  }
  ipLockStore.set(ip, Date.now() + durationMs);
}

export function permanentlyLockIp(ip: string): void {
  if (!ip) {
    return;
  }
  ipLockStore.set(ip, PERMANENT_LOCK_TS);
}

export function unlockIp(ip: string): void {
  if (!ip) {
    return;
  }
  ipLockStore.delete(ip);
}

export function getIpLockState(ip: string): {
  locked: boolean;
  permanent: boolean;
  retryAfterSeconds: number;
} {
  if (!ip) {
    return { locked: false, permanent: false, retryAfterSeconds: 0 };
  }

  const until = ipLockStore.get(ip);
  if (!until) {
    return { locked: false, permanent: false, retryAfterSeconds: 0 };
  }

  if (until === PERMANENT_LOCK_TS) {
    return { locked: true, permanent: true, retryAfterSeconds: 0 };
  }

  const now = Date.now();
  if (until <= now) {
    ipLockStore.delete(ip);
    return { locked: false, permanent: false, retryAfterSeconds: 0 };
  }

  return {
    locked: true,
    permanent: false,
    retryAfterSeconds: Math.max(1, Math.ceil((until - now) / 1000)),
  };
}

export function resetAvatarPolicyIpLockStoreForTests(): void {
  ipLockStore.clear();
}
