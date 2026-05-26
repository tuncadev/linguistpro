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

function printSummary(result) {
  console.log("");
  console.log("Tutor Consistency Summary");
  console.log("-------------------------");
  console.log(`Total tutors: ${result.totalTutors}`);
  console.log(`Total courses: ${result.totalCourses}`);
  console.log(`Published courses: ${result.publishedCourses}`);
  console.log(`Distinct tutors used by courses: ${result.distinctCourseTutorIds}`);
  console.log(`Distinct tutors used by published courses: ${result.distinctPublishedCourseTutorIds}`);
  console.log(`Unassigned tutors: ${result.unassignedTutorCount}`);
}

async function run() {
  const tutors = await prisma.user.findMany({
    where: { role: Role.TUTOR },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "asc" },
  });

  const courses = await prisma.course.findMany({
    select: { id: true, title: true, tutorId: true, status: true },
  });

  const tutorIdSet = new Set(tutors.map((tutor) => tutor.id));
  const publishedCourses = courses.filter((course) => course.status === "PUBLISHED");

  const courseTutorIds = new Set(courses.map((course) => course.tutorId));
  const publishedCourseTutorIds = new Set(publishedCourses.map((course) => course.tutorId));

  const orphanedCourseTutorIds = [...courseTutorIds].filter((id) => !tutorIdSet.has(id));
  const orphanedPublishedCourseTutorIds = [...publishedCourseTutorIds].filter((id) => !tutorIdSet.has(id));

  const tutorCourseCounts = tutors.map((tutor) => {
    const assignedCourses = courses.filter((course) => course.tutorId === tutor.id).length;
    const assignedPublishedCourses = publishedCourses.filter((course) => course.tutorId === tutor.id).length;
    return {
      id: tutor.id,
      name: tutor.name,
      email: tutor.email,
      assignedCourses,
      assignedPublishedCourses,
    };
  });

  const result = {
    totalTutors: tutors.length,
    totalCourses: courses.length,
    publishedCourses: publishedCourses.length,
    distinctCourseTutorIds: courseTutorIds.size,
    distinctPublishedCourseTutorIds: publishedCourseTutorIds.size,
    orphanedCourseTutorIds,
    orphanedPublishedCourseTutorIds,
    unassignedTutorCount: tutorCourseCounts.filter((row) => row.assignedCourses === 0).length,
    tutorCourseCounts,
  };

  const failures = [];
  if (result.totalTutors === 0) {
    failures.push("No tutors exist.");
  }
  if (result.publishedCourses > 0 && result.distinctPublishedCourseTutorIds === 0) {
    failures.push("Published courses exist but no tutor assignments were found.");
  }
  if (result.orphanedCourseTutorIds.length > 0) {
    failures.push("Some courses reference tutor IDs that do not exist in user(role=TUTOR).");
  }
  if (result.orphanedPublishedCourseTutorIds.length > 0) {
    failures.push("Some published courses reference tutor IDs that do not exist in user(role=TUTOR).");
  }

  console.log(JSON.stringify(result, null, 2));
  printSummary(result);

  if (failures.length > 0) {
    console.error("");
    console.error("Consistency check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
  }
}

run()
  .catch((error) => {
    console.error("Failed to run tutor consistency check:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
