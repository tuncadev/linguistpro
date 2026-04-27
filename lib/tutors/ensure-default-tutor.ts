import { Prisma, Role } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";

const DEFAULT_TUTOR_PROFILE = {
  name: "Prof. Elena Rodriguez",
  email: "elena@catalina.edu",
  password: "Tutor123!",
  avatarUrl:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
  bio:
    "Dedicated linguist with over 12 years of experience in Spanish immersion and corporate communication training at Catalina Academy.",
  rating: 4.9,
  studentCount: 15400,
  coursesAuthored: 8,
} as const;

type TutorIdentity = {
  id: string;
};

async function createDefaultTutor(): Promise<TutorIdentity> {
  const passwordHash = await hashPassword(DEFAULT_TUTOR_PROFILE.password);

  try {
    const created = await prisma.user.create({
      data: {
        role: Role.TUTOR,
        name: DEFAULT_TUTOR_PROFILE.name,
        email: DEFAULT_TUTOR_PROFILE.email,
        passwordHash,
        avatarUrl: DEFAULT_TUTOR_PROFILE.avatarUrl,
        bio: DEFAULT_TUTOR_PROFILE.bio,
        rating: DEFAULT_TUTOR_PROFILE.rating,
        studentCount: DEFAULT_TUTOR_PROFILE.studentCount,
        coursesAuthored: DEFAULT_TUTOR_PROFILE.coursesAuthored,
      },
      select: { id: true },
    });

    return created;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.user.findUnique({
        where: { email: DEFAULT_TUTOR_PROFILE.email },
        select: { id: true },
      });
      if (existing) {
        return existing;
      }
    }

    throw error;
  }
}

async function repairInvalidCourseTutorAssignments(fallbackTutorId: string) {
  const invalidCourses = await prisma.course.findMany({
    where: {
      NOT: {
        tutor: {
          role: Role.TUTOR,
        },
      },
    },
    select: { id: true },
    take: 5000,
  });

  if (invalidCourses.length === 0) {
    return;
  }

  await prisma.course.updateMany({
    where: { id: { in: invalidCourses.map((course) => course.id) } },
    data: { tutorId: fallbackTutorId },
  });
}

export async function ensureDefaultTutorAndRepairCourses(): Promise<TutorIdentity> {
  let tutor = await prisma.user.findFirst({
    where: { role: Role.TUTOR },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!tutor) {
    tutor = await createDefaultTutor();
  }

  await repairInvalidCourseTutorAssignments(tutor.id);
  return tutor;
}
