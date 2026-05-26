import fs from "node:fs";
import path from "node:path";
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

loadDatabaseUrlFromEnvLocal();

const prisma = new PrismaClient();
const applyChanges = process.argv.includes("--apply");

async function ensureFallbackTutor() {
  const existingTutor = await prisma.user.findFirst({
    where: { role: Role.TUTOR },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true },
  });
  if (existingTutor) {
    return existingTutor;
  }

  if (!applyChanges) {
    return {
      id: "DRY_RUN_NO_TUTOR",
      name: "Backfill Tutor",
      email: "tutor-backfill@linguistpro.local",
    };
  }

  return prisma.user.create({
    data: {
      role: Role.TUTOR,
      email: `tutor-backfill-${Date.now()}@linguistpro.local`,
      name: "Backfill Tutor",
      emailVerifiedAt: new Date(),
      tutorApprovalStatus: "APPROVED",
      tutorApprovedAt: new Date(),
      tutorApprovalNotes: "Auto-created by tutor backfill script.",
    },
    select: { id: true, name: true, email: true },
  });
}

async function run() {
  const fallbackTutor = await ensureFallbackTutor();
  const tutors = await prisma.user.findMany({
    where: { role: Role.TUTOR },
    select: { id: true, name: true, email: true },
  });
  const tutorIdSet = new Set(tutors.map((tutor) => tutor.id));

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, tutorId: true, status: true },
    orderBy: { createdAt: "asc" },
  });

  const orphanedCourses = courses.filter((course) => !tutorIdSet.has(course.tutorId));

  let reassignedCourses = 0;
  if (applyChanges && orphanedCourses.length > 0 && fallbackTutor.id !== "DRY_RUN_NO_TUTOR") {
    for (const course of orphanedCourses) {
      await prisma.course.update({
        where: { id: course.id },
        data: { tutorId: fallbackTutor.id },
      });
      reassignedCourses += 1;
    }
  }

  const effectiveCourses = applyChanges
    ? await prisma.course.findMany({
        select: { id: true, tutorId: true },
      })
    : courses.map((course) => ({
        id: course.id,
        tutorId: tutorIdSet.has(course.tutorId) ? course.tutorId : fallbackTutor.id,
      }));

  const authoredCounts = new Map();
  for (const course of effectiveCourses) {
    authoredCounts.set(course.tutorId, (authoredCounts.get(course.tutorId) ?? 0) + 1);
  }

  if (applyChanges) {
    for (const tutor of tutors) {
      await prisma.user.update({
        where: { id: tutor.id },
        data: { coursesAuthored: authoredCounts.get(tutor.id) ?? 0 },
      });
    }
    if (fallbackTutor.id !== "DRY_RUN_NO_TUTOR" && !tutorIdSet.has(fallbackTutor.id)) {
      await prisma.user.update({
        where: { id: fallbackTutor.id },
        data: { coursesAuthored: authoredCounts.get(fallbackTutor.id) ?? 0 },
      });
    }
  }

  const report = {
    mode: applyChanges ? "apply" : "dry-run",
    fallbackTutor,
    totalTutorsBefore: tutors.length,
    totalCourses: courses.length,
    orphanedCourses: orphanedCourses.map((course) => ({
      id: course.id,
      title: course.title,
      previousTutorId: course.tutorId,
      reassignedTutorId: fallbackTutor.id,
    })),
    reassignedCourses,
    calculatedCoursesAuthored: Object.fromEntries(authoredCounts.entries()),
  };

  console.log(JSON.stringify(report, null, 2));
}

run()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
