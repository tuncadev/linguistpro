import type { Prisma } from "@prisma/client";

export const courseInclude = {
  language: true,
  level: true,
  tutor: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
    },
  },
  syllabusSections: {
    orderBy: { position: "asc" },
    include: {
      lessons: {
        orderBy: { position: "asc" },
      },
    },
  },
} satisfies Prisma.CourseInclude;

export type CourseWithRelations = Prisma.CourseGetPayload<{
  include: typeof courseInclude;
}>;

function toNumber(value: Prisma.Decimal | number): number {
  if (typeof value === "number") {
    return value;
  }
  return value.toNumber();
}

export function serializeCourse(course: CourseWithRelations) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    price: toNumber(course.price),
    imageUrl: course.imageUrl,
    status: course.status,
    publishedAt: course.publishedAt?.toISOString() ?? null,
    tutorId: course.tutorId,
    languageId: course.languageId,
    levelId: course.levelId,
    studentCount: course.studentCount,
    rating: course.rating,
    reviews: course.reviews,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    tutor: course.tutor,
    language: course.language,
    level: course.level,
    syllabus: course.syllabusSections.map((section) => ({
      id: section.id,
      title: section.title,
      position: section.position,
      lessons: section.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        position: lesson.position,
        durationSeconds: lesson.durationSeconds,
        content: lesson.content,
      })),
    })),
  };
}

