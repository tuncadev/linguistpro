import { Course, Lesson, SyllabusSection } from "../types";
import {
  DEFAULT_COURSE_DIRECTOR_LABEL,
  DEFAULT_COURSE_DISCOUNT_LABEL,
  DEFAULT_COURSE_ENROLLMENT_INCLUDES,
  DEFAULT_COURSE_LEARNING_OBJECTIVES,
  DEFAULT_COURSE_TUITION_LABEL,
} from "@/lib/courses/presentation-defaults";

type ApiLesson = {
  id: string;
  title: string;
  type: string;
  durationSeconds: number | null;
  content: string | null;
};

type ApiSyllabusSection = {
  id: string;
  title: string;
  position: number;
  lessons: ApiLesson[];
};

type ApiCourse = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  status: "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "ARCHIVED";
  tutorId: string;
  languageId: string;
  levelId: string;
  studentCount: number;
  rating: number;
  reviews: number;
  learningObjectives?: string[] | null;
  enrollmentIncludes?: string[] | null;
  tuitionLabel?: string | null;
  discountLabel?: string | null;
  courseDirectorLabel?: string | null;
  syllabus: ApiSyllabusSection[];
};

type ListCoursesResponse = {
  data?: ApiCourse[];
};

function toLessonType(rawType: string): Lesson["type"] {
  const normalized = rawType.toLowerCase();
  if (normalized === "quiz" || normalized === "reading") {
    return normalized;
  }
  return "video";
}

function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds || durationSeconds <= 0) {
    return "00:00";
  }
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function mapSyllabus(sections: ApiSyllabusSection[]): SyllabusSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    lessons: section.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      duration: formatDuration(lesson.durationSeconds),
      type: toLessonType(lesson.type),
      content: lesson.content ?? undefined,
    })),
  }));
}

function normalizeStringArray(value: string[] | null | undefined, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((item) => item.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : fallback;
}

export function mapApiCourseToFrontendCourse(apiCourse: ApiCourse): Course {
  return {
    id: apiCourse.id,
    title: apiCourse.title,
    description: apiCourse.description,
    price: apiCourse.price,
    imageUrl: apiCourse.imageUrl ?? "https://picsum.photos/seed/course-fallback/800/450",
    status: apiCourse.status,
    tutorId: apiCourse.tutorId,
    languageId: apiCourse.languageId,
    levelId: apiCourse.levelId,
    studentCount: apiCourse.studentCount,
    rating: apiCourse.rating,
    reviews: apiCourse.reviews,
    learningObjectives: normalizeStringArray(
      apiCourse.learningObjectives,
      DEFAULT_COURSE_LEARNING_OBJECTIVES
    ),
    enrollmentIncludes: normalizeStringArray(
      apiCourse.enrollmentIncludes,
      DEFAULT_COURSE_ENROLLMENT_INCLUDES
    ),
    tuitionLabel: apiCourse.tuitionLabel || DEFAULT_COURSE_TUITION_LABEL,
    discountLabel: apiCourse.discountLabel || DEFAULT_COURSE_DISCOUNT_LABEL,
    courseDirectorLabel:
      apiCourse.courseDirectorLabel || DEFAULT_COURSE_DIRECTOR_LABEL,
    syllabus: mapSyllabus(apiCourse.syllabus ?? []),
  };
}

export async function fetchPublishedCourses(): Promise<Course[] | null> {
  try {
    const response = await fetch("/api/courses");
    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as ListCoursesResponse;
    if (!json.data) {
      return null;
    }

    return json.data.map(mapApiCourseToFrontendCourse);
  } catch (error) {
    console.error("fetchPublishedCourses error", error);
    return null;
  }
}
