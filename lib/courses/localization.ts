import { type JsonObject, type JsonValue, getValueByDottedKey } from "@/lib/i18n/translation-registry";

type LocalizedLesson = {
  title: string;
  content: string | null;
};

type LocalizedSection = {
  title: string;
  lessons: LocalizedLesson[];
};

type LocalizableCourse = {
  id: string;
  title: string;
  description: string;
  tuitionLabel: string;
  discountLabel: string;
  courseDirectorLabel: string;
  learningObjectives: string[];
  enrollmentIncludes: string[];
  syllabus: LocalizedSection[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : fallback;
}

function readStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : fallback;
}

export function localizeCourseFromMessages<T extends LocalizableCourse>(
  course: T,
  localeMessages: JsonObject
): T {
  const localizedNode = getValueByDottedKey(
    localeMessages,
    `content.courses.${course.id}`
  ) as JsonValue | undefined;

  if (!isObject(localizedNode)) {
    return course;
  }

  const localizedSyllabus = course.syllabus.map((section, sectionIndex) => {
    const translatedSectionRaw = Array.isArray(localizedNode.syllabus)
      ? localizedNode.syllabus[sectionIndex]
      : undefined;
    const translatedSection = isObject(translatedSectionRaw) ? translatedSectionRaw : undefined;

    return {
      ...section,
      title: readString(translatedSection?.title, section.title),
      lessons: section.lessons.map((lesson, lessonIndex) => {
        const translatedLessonRaw =
          translatedSection && Array.isArray(translatedSection.lessons)
            ? translatedSection.lessons[lessonIndex]
            : undefined;
        const translatedLesson = isObject(translatedLessonRaw) ? translatedLessonRaw : undefined;
        return {
          ...lesson,
          title: readString(translatedLesson?.title, lesson.title),
          content:
            typeof translatedLesson?.content === "string"
              ? translatedLesson.content
              : lesson.content,
        };
      }),
    };
  });

  return {
    ...course,
    title: readString(localizedNode.title, course.title),
    description: readString(localizedNode.description, course.description),
    tuitionLabel: readString(localizedNode.tuitionLabel, course.tuitionLabel),
    discountLabel: readString(localizedNode.discountLabel, course.discountLabel),
    courseDirectorLabel: readString(
      localizedNode.courseDirectorLabel,
      course.courseDirectorLabel
    ),
    learningObjectives: readStringArray(
      localizedNode.learningObjectives,
      course.learningObjectives
    ),
    enrollmentIncludes: readStringArray(
      localizedNode.enrollmentIncludes,
      course.enrollmentIncludes
    ),
    syllabus: localizedSyllabus,
  };
}
