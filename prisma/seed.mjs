import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_USERS = [
  {
    name: "LinguistPro Admin",
    email: "admin@linguistpro.local",
    role: "ADMIN",
    password: "Admin123!",
  },
  {
    name: "LinguistPro Tutor",
    email: "tutor@linguistpro.local",
    role: "TUTOR",
    password: "Tutor123!",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    bio: "Senior Catalina tutor focused on practical language fluency and conversational confidence.",
    rating: 4.9,
    studentCount: 15400,
    coursesAuthored: 8,
  },
  {
    name: "LinguistPro Student",
    email: "student@linguistpro.local",
    role: "STUDENT",
    password: "Student123!",
  },
];

const DEFAULT_LANGUAGES = [
  { name: "English", code: "en" },
  { name: "Spanish", code: "es" },
  { name: "German", code: "de" },
];

const DEFAULT_LEVELS = [
  { name: "Beginner", slug: "beginner", description: "Entry-level coursework." },
  { name: "Intermediate", slug: "intermediate", description: "Core practical progression." },
  { name: "Advanced", slug: "advanced", description: "Professional fluency track." },
];

const DEFAULT_FEATURE_FLAGS = [
  {
    key: "billing_v1",
    description: "Enable billing/subscription checkout flows",
    enabled: false,
  },
  {
    key: "email_workflows_v1",
    description: "Enable transactional email workflow integrations",
    enabled: false,
  },
  {
    key: "recommendations_v1",
    description: "Enable personalized course recommendation engine",
    enabled: false,
  },
];

async function upsertUsers() {
  const users = {};

  for (const user of DEFAULT_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const saved = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
        rating: user.rating ?? null,
        studentCount: user.studentCount ?? null,
        coursesAuthored: user.coursesAuthored ?? null,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash,
        avatarUrl: user.avatarUrl ?? null,
        bio: user.bio ?? null,
        rating: user.rating ?? null,
        studentCount: user.studentCount ?? null,
        coursesAuthored: user.coursesAuthored ?? null,
      },
    });
    users[user.role] = saved;
  }

  return users;
}

async function upsertLanguages() {
  const languages = {};

  for (const language of DEFAULT_LANGUAGES) {
    const saved = await prisma.language.upsert({
      where: { code: language.code },
      update: { name: language.name },
      create: language,
    });
    languages[language.code] = saved;
  }

  return languages;
}

async function upsertLevels() {
  const levels = {};

  for (const level of DEFAULT_LEVELS) {
    const saved = await prisma.level.upsert({
      where: { slug: level.slug },
      update: {
        name: level.name,
        description: level.description,
      },
      create: level,
    });
    levels[level.slug] = saved;
  }

  return levels;
}

async function upsertFeatureFlags() {
  for (const flag of DEFAULT_FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {
        description: flag.description,
      },
      create: flag,
    });
  }
}

async function ensureSampleCourse({ tutorId, languageId, levelId }) {
  const existing = await prisma.course.findFirst({
    where: {
      title: "Practical English Conversation",
      tutorId,
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.course.create({
    data: {
      title: "Practical English Conversation",
      description:
        "A project-style speaking course focused on daily conversation, pronunciation, and confidence.",
      price: 99,
      imageUrl: "https://picsum.photos/seed/english-course/800/450",
      status: "PUBLISHED",
      publishedAt: new Date(),
      tutorId,
      languageId,
      levelId,
      studentCount: 1,
      rating: 4.8,
      reviews: 12,
      syllabusSections: {
        create: [
          {
            title: "Conversation Basics",
            position: 1,
            lessons: {
              create: [
                {
                  title: "Introductions and Small Talk",
                  type: "VIDEO",
                  durationSeconds: 780,
                  position: 1,
                  content: "Warm-up speaking scenarios and common patterns.",
                },
                {
                  title: "Listening Comprehension Check",
                  type: "QUIZ",
                  durationSeconds: 420,
                  position: 2,
                  content: "Comprehension and response confidence check.",
                },
              ],
            },
          },
          {
            title: "Real-life Practice",
            position: 2,
            lessons: {
              create: [
                {
                  title: "Restaurant and Travel Dialogues",
                  type: "READING",
                  durationSeconds: 600,
                  position: 1,
                  content: "Practical scripts for real-world contexts.",
                },
              ],
            },
          },
        ],
      },
    },
    select: { id: true },
  });

  return created.id;
}

async function main() {
  const users = await upsertUsers();
  const languages = await upsertLanguages();
  const levels = await upsertLevels();
  await upsertFeatureFlags();

  const sampleCourseId = await ensureSampleCourse({
    tutorId: users.TUTOR.id,
    languageId: languages.en.id,
    levelId: levels.beginner.id,
  });

  await prisma.enrollment.upsert({
    where: {
      courseId_studentId: {
        courseId: sampleCourseId,
        studentId: users.STUDENT.id,
      },
    },
    update: {},
    create: {
      courseId: sampleCourseId,
      studentId: users.STUDENT.id,
    },
  });

  console.log("Seed completed.");
  console.log("Admin: admin@linguistpro.local / Admin123!");
  console.log("Tutor: tutor@linguistpro.local / Tutor123!");
  console.log("Student: student@linguistpro.local / Student123!");
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
