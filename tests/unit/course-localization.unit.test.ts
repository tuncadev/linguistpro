import { describe, expect, it } from "vitest";
import { localizeCourseFromMessages } from "@/lib/courses/localization";
import type { JsonObject } from "@/lib/i18n/translation-registry";

describe("course localization", () => {
  it("applies translated course title and nested syllabus fields", () => {
    const course = {
      id: "course-1",
      title: "English Title",
      description: "English Description",
      tuitionLabel: "Tuition Fee",
      discountLabel: "65% Off Enrollment",
      courseDirectorLabel: "Course Director",
      learningObjectives: ["Objective A", "Objective B"],
      enrollmentIncludes: ["Item A", "Item B"],
      syllabus: [
        {
          title: "Module 1",
          lessons: [
            { title: "Lesson 1", content: "Content 1" },
            { title: "Lesson 2", content: null },
          ],
        },
      ],
    };

    const messages: JsonObject = {
      content: {
        courses: {
          "course-1": {
            title: "Український заголовок",
            learningObjectives: ["Мета 1", "Мета 2"],
            syllabus: [
              {
                title: "Модуль 1",
                lessons: [{ title: "Урок 1", content: "Контент 1" }],
              },
            ],
          },
        },
      },
    };

    const localized = localizeCourseFromMessages(course, messages);
    expect(localized.title).toBe("Український заголовок");
    expect(localized.learningObjectives).toEqual(["Мета 1", "Мета 2"]);
    expect(localized.syllabus[0].title).toBe("Модуль 1");
    expect(localized.syllabus[0].lessons[0].title).toBe("Урок 1");
    expect(localized.syllabus[0].lessons[0].content).toBe("Контент 1");
    expect(localized.syllabus[0].lessons[1].title).toBe("Lesson 2");
  });

  it("keeps source values when translation node is missing", () => {
    const course = {
      id: "course-missing",
      title: "English Title",
      description: "English Description",
      tuitionLabel: "Tuition Fee",
      discountLabel: "65% Off Enrollment",
      courseDirectorLabel: "Course Director",
      learningObjectives: ["Objective A"],
      enrollmentIncludes: ["Item A"],
      syllabus: [{ title: "Module 1", lessons: [{ title: "Lesson 1", content: null }] }],
    };

    const localized = localizeCourseFromMessages(course, {});
    expect(localized).toEqual(course);
  });
});
