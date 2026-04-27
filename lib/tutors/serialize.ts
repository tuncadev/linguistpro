import type { Prisma } from "@prisma/client";

export const publicTutorSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  bio: true,
  rating: true,
  studentCount: true,
  coursesAuthored: true,
  _count: {
    select: {
      authoredCourses: true,
    },
  },
} satisfies Prisma.UserSelect;

export const adminTutorSelect = {
  ...publicTutorSelect,
  passwordHash: true,
} satisfies Prisma.UserSelect;

type PublicTutorRecord = Prisma.UserGetPayload<{
  select: typeof publicTutorSelect;
}>;

type AdminTutorRecord = Prisma.UserGetPayload<{
  select: typeof adminTutorSelect;
}>;

export function serializeTutor(tutor: PublicTutorRecord) {
  return {
    id: tutor.id,
    name: tutor.name,
    email: tutor.email,
    role: tutor.role,
    avatarUrl: tutor.avatarUrl,
    bio: tutor.bio,
    rating: tutor.rating,
    studentCount: tutor.studentCount,
    coursesAuthored: tutor.coursesAuthored ?? tutor._count.authoredCourses,
  };
}

export function serializeTutorForAdmin(tutor: AdminTutorRecord) {
  return {
    ...serializeTutor(tutor),
    hasPassword: Boolean(tutor.passwordHash),
  };
}
