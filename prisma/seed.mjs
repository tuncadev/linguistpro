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
  { name: "French", code: "fr" },
  { name: "Japanese", code: "jp" },
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

const DEFAULT_LEARNING_OBJECTIVES = [
  "Master essential conversational idioms",
  "Professional and formal communication skills",
  "Deep cultural immersion and history",
  "Phonetic mastery and accent reduction",
  "Practical vocabulary for daily life",
  "Catalina Academy Official Certification",
];

const DEFAULT_ENROLLMENT_INCLUDES = [
  "Lifetime curriculum access",
  "Catalina Professional Certificate",
  "Private Discord community",
];

const DEFAULT_SYLLABUS = [
  {
    title: "Foundations & Greetings",
    lessons: [
      {
        title: "The Spanish Alphabet & Phonetics",
        durationSeconds: 765,
        type: "VIDEO",
        content: "Core phonetics and pronunciation warm-up.",
      },
      {
        title: "Essential Greetings & Introductions",
        durationSeconds: 500,
        type: "VIDEO",
        content: "How to confidently introduce yourself in real settings.",
      },
      {
        title: "Quiz: Basic Greetings",
        durationSeconds: 300,
        type: "QUIZ",
        content: "Short comprehension and recall check.",
      },
    ],
  },
  {
    title: "Daily Life Vocabulary",
    lessons: [
      {
        title: "At the Restaurant: Ordering Food",
        durationSeconds: 910,
        type: "VIDEO",
        content: "Practical phrases for dining and ordering.",
      },
      {
        title: "Numbers, Time and Dates",
        durationSeconds: 630,
        type: "VIDEO",
        content: "High-frequency grammar and daily communication patterns.",
      },
      {
        title: "Reading: A Day in Madrid",
        durationSeconds: 600,
        type: "READING",
        content: "A contextual reading assignment with vocabulary highlights.",
      },
    ],
  },
];

const DEFAULT_COURSE_PRESETS = [
  {
    title: "Mastering Conversational Spanish",
    description:
      "A deep dive into everyday Spanish dialogues and essential grammar for travelers. Learn how to navigate real-world scenarios with confidence and cultural nuance.",
    price: 49.99,
    imageUrl:
      "https://cdn.leonardo.ai/users/75e0bb81-fe53-49f4-94db-184d4cbb75cb/generations/1f10523c-f37c-6950-8f3c-fae34707a6ae/lucid-origin_In_the_heart_of_Madrid_a_breathtakingly_beautiful_photograph_of_a_historic_stree-0.jpg",
    languageCode: "es",
    levelSlug: "intermediate",
    studentCount: 154,
    rating: 4.8,
    reviews: 1240,
  },
  {
    title: "Business English for Professionals",
    description:
      "Enhance your corporate communication, presentation skills, and professional writing. Perfect for non-native speakers in global environments.",
    price: 89,
    imageUrl:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
    languageCode: "en",
    levelSlug: "advanced",
    studentCount: 89,
    rating: 4.9,
    reviews: 850,
  },
  {
    title: "French Gastronomy & Language",
    description:
      "Learn French through the lens of culinary arts and wine culture. Master cooking vocabulary while mastering the language.",
    price: 55,
    imageUrl:
      "https://cdn.leonardo.ai/users/75e0bb81-fe53-49f4-94db-184d4cbb75cb/generations/1f105236-0c5b-6540-b837-d338c152e6b3/lucid-origin_In_the_heart_of_Paris_a_breathtakingly_dramatic_painting_captures_the_essence_of-0.jpg",
    languageCode: "fr",
    levelSlug: "beginner",
    studentCount: 42,
    rating: 4.7,
    reviews: 320,
  },
  {
    title: "Practical English Conversation",
    description:
      "A project-style speaking course focused on daily conversation, pronunciation, and confidence.",
    price: 99,
    imageUrl: "https://picsum.photos/seed/english-course/800/450",
    languageCode: "en",
    levelSlug: "beginner",
    studentCount: 1,
    rating: 4.8,
    reviews: 12,
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

async function upsertCoursePreset({ tutorId, languages, levels, preset }) {
  const language = languages[preset.languageCode];
  const level = levels[preset.levelSlug];

  if (!language || !level) {
    return null;
  }

  const existing = await prisma.course.findFirst({
    where: {
      title: preset.title,
      tutorId,
    },
    select: { id: true },
  });

  const baseData = {
    title: preset.title,
    description: preset.description,
    price: preset.price,
    imageUrl: preset.imageUrl,
    status: "PUBLISHED",
    publishedAt: new Date(),
    tutorId,
    languageId: language.id,
    levelId: level.id,
    studentCount: preset.studentCount,
    rating: preset.rating,
    reviews: preset.reviews,
    learningObjectives: DEFAULT_LEARNING_OBJECTIVES,
    enrollmentIncludes: DEFAULT_ENROLLMENT_INCLUDES,
    tuitionLabel: "Tuition Fee",
    discountLabel: "65% Off Enrollment",
    courseDirectorLabel: "Course Director",
  };

  if (!existing) {
    const created = await prisma.course.create({
      data: {
        ...baseData,
        syllabusSections: {
          create: DEFAULT_SYLLABUS.map((section, sectionIndex) => ({
            title: section.title,
            position: sectionIndex + 1,
            lessons: {
              create: section.lessons.map((lesson, lessonIndex) => ({
                title: lesson.title,
                type: lesson.type,
                durationSeconds: lesson.durationSeconds,
                content: lesson.content,
                position: lessonIndex + 1,
              })),
            },
          })),
        },
      },
      select: { id: true },
    });

    return created.id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.course.update({
      where: { id: existing.id },
      data: baseData,
    });

    await tx.syllabusSection.deleteMany({
      where: { courseId: existing.id },
    });

    await tx.course.update({
      where: { id: existing.id },
      data: {
        syllabusSections: {
          create: DEFAULT_SYLLABUS.map((section, sectionIndex) => ({
            title: section.title,
            position: sectionIndex + 1,
            lessons: {
              create: section.lessons.map((lesson, lessonIndex) => ({
                title: lesson.title,
                type: lesson.type,
                durationSeconds: lesson.durationSeconds,
                content: lesson.content,
                position: lessonIndex + 1,
              })),
            },
          })),
        },
      },
    });
  });

  return existing.id;
}

async function upsertDefaultCourses({ tutorId, languages, levels }) {
  const courseIdsByTitle = {};

  for (const preset of DEFAULT_COURSE_PRESETS) {
    const courseId = await upsertCoursePreset({
      tutorId,
      languages,
      levels,
      preset,
    });

    if (courseId) {
      courseIdsByTitle[preset.title] = courseId;
    }
  }

  return courseIdsByTitle;
}

async function main() {
  const users = await upsertUsers();
  const languages = await upsertLanguages();
  const levels = await upsertLevels();
  await upsertFeatureFlags();

  const coursesByTitle = await upsertDefaultCourses({
    tutorId: users.TUTOR.id,
    languages,
    levels,
  });

  const enrollmentCourseId =
    coursesByTitle["Practical English Conversation"] ?? Object.values(coursesByTitle)[0];

  if (enrollmentCourseId) {
    await prisma.enrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: enrollmentCourseId,
          studentId: users.STUDENT.id,
        },
      },
      update: {},
      create: {
        courseId: enrollmentCourseId,
        studentId: users.STUDENT.id,
      },
    });
  }

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
