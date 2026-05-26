import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { PrismaClient, Role } from "@prisma/client";

function loadDatabaseUrlFromEnvLocal() {
  if (process.env.DATABASE_URL) {
    return;
  }

  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    if (key !== "DATABASE_URL") {
      continue;
    }
    const value = line.slice(separatorIndex + 1).trim();
    if (value) {
      process.env.DATABASE_URL = value;
    }
    break;
  }
}

function parseSystemdShow(output) {
  const result = {};
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim() || !line.includes("=")) {
      continue;
    }
    const [key, ...rest] = line.split("=");
    result[key] = rest.join("=");
  }
  return result;
}

async function fetchTutorCountFromApi(baseUrl) {
  const response = await fetch(`${baseUrl}/api/tutors`);
  if (!response.ok) {
    throw new Error(`Tutor API returned ${response.status}`);
  }
  const payload = await response.json();
  const tutors = Array.isArray(payload?.data) ? payload.data : [];
  return tutors.length;
}

function getServiceState(serviceName) {
  const raw = execSync(
    `systemctl --user show ${serviceName} --property=ActiveState --property=WorkingDirectory --property=FragmentPath --property=ExecStart`,
    { encoding: "utf8" }
  );
  return parseSystemdShow(raw);
}

loadDatabaseUrlFromEnvLocal();

const prisma = new PrismaClient();

async function run() {
  const serviceName = process.env.RUNTIME_SERVICE_NAME || "linguistpro-dev.service";
  const expectedWorkingDirectory = process.cwd();
  const baseUrl = process.env.RUNTIME_BASE_URL || "http://127.0.0.1:3001";

  const serviceState = getServiceState(serviceName);
  const dbTutorCount = await prisma.user.count({ where: { role: Role.TUTOR } });
  const apiTutorCount = await fetchTutorCountFromApi(baseUrl);

  const checks = {
    serviceName,
    baseUrl,
    expectedWorkingDirectory,
    serviceActiveState: serviceState.ActiveState ?? "unknown",
    serviceWorkingDirectory: serviceState.WorkingDirectory ?? "",
    serviceFragmentPath: serviceState.FragmentPath ?? "",
    serviceExecStart: serviceState.ExecStart ?? "",
    tutorCount: {
      database: dbTutorCount,
      api: apiTutorCount,
    },
    checks: {
      serviceIsActive: serviceState.ActiveState === "active",
      serviceWorkingDirectoryMatches: (serviceState.WorkingDirectory ?? "") === expectedWorkingDirectory,
      tutorCountMatchesBetweenApiAndDb: dbTutorCount === apiTutorCount,
    },
  };

  const failures = [];
  if (!checks.checks.serviceIsActive) {
    failures.push(`Service ${serviceName} is not active.`);
  }
  if (!checks.checks.serviceWorkingDirectoryMatches) {
    failures.push(
      `Service working directory mismatch. expected=${expectedWorkingDirectory} actual=${serviceState.WorkingDirectory ?? ""}`
    );
  }
  if (!checks.checks.tutorCountMatchesBetweenApiAndDb) {
    failures.push(`Tutor count mismatch between API (${apiTutorCount}) and DB (${dbTutorCount}).`);
  }

  console.log(JSON.stringify(checks, null, 2));

  if (failures.length > 0) {
    console.error("");
    console.error("Runtime data-source check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }
}

run()
  .catch((error) => {
    console.error("Failed to run runtime data-source check:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
