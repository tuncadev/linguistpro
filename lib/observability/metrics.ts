type RouteMetric = {
  method: string;
  path: string;
  total: number;
  byStatusClass: {
    s2xx: number;
    s3xx: number;
    s4xx: number;
    s5xx: number;
  };
  lastStatus: number;
  lastDurationMs: number;
  lastSeenAt: string;
};

type MetricsStore = {
  startedAt: string;
  totalRequests: number;
  totalErrors: number;
  byStatusClass: {
    s2xx: number;
    s3xx: number;
    s4xx: number;
    s5xx: number;
  };
  routes: Map<string, RouteMetric>;
};

const METRICS_STORE_KEY = "__linguistpro_metrics_store__";

function getStatusClassKey(status: number): keyof MetricsStore["byStatusClass"] {
  if (status >= 500) return "s5xx";
  if (status >= 400) return "s4xx";
  if (status >= 300) return "s3xx";
  return "s2xx";
}

function createStore(): MetricsStore {
  return {
    startedAt: new Date().toISOString(),
    totalRequests: 0,
    totalErrors: 0,
    byStatusClass: {
      s2xx: 0,
      s3xx: 0,
      s4xx: 0,
      s5xx: 0,
    },
    routes: new Map(),
  };
}

function getStore(): MetricsStore {
  const globalState = globalThis as typeof globalThis & {
    [METRICS_STORE_KEY]?: MetricsStore;
  };

  if (!globalState[METRICS_STORE_KEY]) {
    globalState[METRICS_STORE_KEY] = createStore();
  }

  return globalState[METRICS_STORE_KEY];
}

export function recordApiRequest(input: {
  method: string;
  path: string;
  status: number;
  durationMs: number;
}) {
  const store = getStore();
  const key = `${input.method.toUpperCase()} ${input.path}`;
  const statusClass = getStatusClassKey(input.status);
  const now = new Date().toISOString();

  store.totalRequests += 1;
  store.byStatusClass[statusClass] += 1;
  if (input.status >= 500) {
    store.totalErrors += 1;
  }

  const existing =
    store.routes.get(key) ??
    ({
      method: input.method.toUpperCase(),
      path: input.path,
      total: 0,
      byStatusClass: {
        s2xx: 0,
        s3xx: 0,
        s4xx: 0,
        s5xx: 0,
      },
      lastStatus: input.status,
      lastDurationMs: input.durationMs,
      lastSeenAt: now,
    } satisfies RouteMetric);

  existing.total += 1;
  existing.byStatusClass[statusClass] += 1;
  existing.lastStatus = input.status;
  existing.lastDurationMs = input.durationMs;
  existing.lastSeenAt = now;

  store.routes.set(key, existing);
}

export function getMetricsSnapshot(limit = 50) {
  const store = getStore();
  const uptimeMs = Date.now() - new Date(store.startedAt).getTime();
  const routes = Array.from(store.routes.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, Math.max(1, Math.min(limit, 500)));

  return {
    startedAt: store.startedAt,
    uptimeSeconds: Math.floor(uptimeMs / 1000),
    totalRequests: store.totalRequests,
    totalErrors: store.totalErrors,
    byStatusClass: store.byStatusClass,
    routes,
  };
}

export function resetMetricsForTests() {
  const globalState = globalThis as typeof globalThis & {
    [METRICS_STORE_KEY]?: MetricsStore;
  };
  globalState[METRICS_STORE_KEY] = createStore();
}
