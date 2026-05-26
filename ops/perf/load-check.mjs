import fs from "node:fs";
import path from "node:path";

const baseUrl = process.env.PERF_BASE_URL || "http://127.0.0.1:3001";
const iterations = Number(process.env.PERF_ITERATIONS || 40);
const concurrency = Number(process.env.PERF_CONCURRENCY || 8);
const p95ThresholdMs = Number(process.env.PERF_P95_THRESHOLD_MS || 800);
const maxErrorRate = Number(process.env.PERF_MAX_ERROR_RATE || 0.05);

const reportDir = path.resolve(process.cwd(), "ops/uat/reports");
fs.mkdirSync(reportDir, { recursive: true });
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const reportFile = path.join(reportDir, `perf-load-${timestamp}.md`);

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[index];
}

async function loginStudent() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: process.env.PERF_STUDENT_EMAIL || "student@linguistpro.local",
      password: process.env.PERF_STUDENT_PASSWORD || "Student123!",
    }),
  });
  if (!response.ok) {
    throw new Error(`Student login failed with status ${response.status}`);
  }

  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length === 0) {
    const single = response.headers.get("set-cookie");
    if (!single) {
      throw new Error("Missing session cookie from login response");
    }
    return single.split(";")[0];
  }

  return setCookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function requestJson(url, init = {}) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { response, payload };
}

async function warmupContext(cookieHeader) {
  const { response, payload } = await requestJson(`${baseUrl}/api/courses`);
  if (!response.ok) {
    throw new Error(`Failed to read courses for warmup: ${response.status}`);
  }
  const courses = Array.isArray(payload?.data) ? payload.data : [];
  if (courses.length === 0) {
    throw new Error("No published courses found for performance checks.");
  }

  let selectedCourse = courses.find((course) => course?.syllabus?.some((section) => section?.lessons?.length > 0));
  if (!selectedCourse) {
    selectedCourse = courses[0];
  }

  const courseId = selectedCourse.id;
  const lessonId = selectedCourse?.syllabus?.find((section) => section?.lessons?.length > 0)?.lessons?.[0]?.id;
  if (!lessonId) {
    throw new Error("No lesson found for first published course.");
  }

  await requestJson(`${baseUrl}/api/enroll`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({ courseId }),
  });

  return { courseId, lessonId };
}

async function runScenario(name, fn) {
  const latencies = [];
  let failures = 0;

  const workers = Array.from({ length: concurrency }).map(async (_, workerIndex) => {
    for (let i = workerIndex; i < iterations; i += concurrency) {
      const started = performance.now();
      try {
        const ok = await fn();
        if (!ok) {
          failures += 1;
        }
      } catch {
        failures += 1;
      } finally {
        latencies.push(performance.now() - started);
      }
    }
  });

  await Promise.all(workers);

  const p95 = percentile(latencies, 95);
  const p50 = percentile(latencies, 50);
  const errorRate = latencies.length === 0 ? 1 : failures / latencies.length;
  const pass = p95 <= p95ThresholdMs && errorRate <= maxErrorRate;

  return {
    name,
    totalRequests: latencies.length,
    failures,
    errorRate,
    p50Ms: p50,
    p95Ms: p95,
    pass,
  };
}

function toPct(value) {
  return `${(value * 100).toFixed(2)}%`;
}

async function main() {
  const cookie = await loginStudent();
  const context = await warmupContext(cookie);

  const scenarios = [
    await runScenario("Browse Courses", async () => {
      const response = await fetch(`${baseUrl}/api/courses`);
      return response.status === 200;
    }),
    await runScenario("Tutor Directory", async () => {
      const response = await fetch(`${baseUrl}/api/tutors`);
      return response.status === 200;
    }),
    await runScenario("Enroll API", async () => {
      const response = await fetch(`${baseUrl}/api/enroll`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie,
        },
        body: JSON.stringify({ courseId: context.courseId }),
      });
      return response.status === 200 || response.status === 201;
    }),
    await runScenario("Lesson Access Guard", async () => {
      const response = await fetch(
        `${baseUrl}/api/learning/access?courseId=${encodeURIComponent(context.courseId)}&lessonId=${encodeURIComponent(context.lessonId)}`,
        {
          headers: {
            cookie,
          },
        }
      );
      return response.status === 200;
    }),
  ];

  const status = scenarios.every((scenario) => scenario.pass) ? "PASS" : "FAIL";

  const lines = [
    "# Performance Load Check",
    "",
    `- Generated: ${timestamp}`,
    `- Base URL: ${baseUrl}`,
    `- Iterations per scenario: ${iterations}`,
    `- Concurrency: ${concurrency}`,
    `- Thresholds: p95 <= ${p95ThresholdMs}ms, errorRate <= ${toPct(maxErrorRate)}`,
    `- Overall: ${status}`,
    "",
    "| Scenario | Requests | Failures | Error Rate | P50 (ms) | P95 (ms) | Result |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- |",
  ];

  for (const scenario of scenarios) {
    lines.push(
      `| ${scenario.name} | ${scenario.totalRequests} | ${scenario.failures} | ${toPct(scenario.errorRate)} | ${scenario.p50Ms.toFixed(
        1
      )} | ${scenario.p95Ms.toFixed(1)} | ${scenario.pass ? "PASS" : "FAIL"} |`
    );
  }

  fs.writeFileSync(reportFile, `${lines.join("\n")}\n`, "utf8");
  console.log(`Performance report: ${reportFile}`);

  if (status !== "PASS") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Performance load check failed:", error);
  process.exitCode = 1;
});
