import { describe, expect, it } from "vitest";
import { mapApiCourseToFrontendCourse } from "../../services/courseApiService";

describe("mapApiCourseToFrontendCourse", () => {
  it("maps API payload to frontend course shape with safe fallbacks", () => {
    const mapped = mapApiCourseToFrontendCourse({
      id: "course_1",
      title: "English B1 Bootcamp",
      description: "Course description",
      price: 129,
      imageUrl: null,
      status: "PUBLISHED",
      tutorId: "tutor_1",
      languageId: "lang_en",
      levelId: "level_b1",
      studentCount: 42,
      rating: 4.7,
      reviews: 21,
      syllabus: [
        {
          id: "section_1",
          title: "Getting Started",
          position: 1,
          lessons: [
            {
              id: "lesson_1",
              title: "Welcome",
              type: "QUIZ",
              durationSeconds: 125,
              content: null,
            },
            {
              id: "lesson_2",
              title: "Reading Warmup",
              type: "reading",
              durationSeconds: null,
              content: "Read this",
            },
            {
              id: "lesson_3",
              title: "Unsupported Type",
              type: "podcast",
              durationSeconds: -10,
              content: null,
            },
          ],
        },
      ],
    });

    expect(mapped.imageUrl).toBe("https://picsum.photos/seed/course-fallback/800/450");
    expect(mapped.syllabus).toHaveLength(1);
    expect(mapped.syllabus[0]?.lessons).toHaveLength(3);
    expect(mapped.syllabus[0]?.lessons[0]?.type).toBe("quiz");
    expect(mapped.syllabus[0]?.lessons[1]?.type).toBe("reading");
    expect(mapped.syllabus[0]?.lessons[2]?.type).toBe("video");
    expect(mapped.syllabus[0]?.lessons[0]?.duration).toBe("02:05");
    expect(mapped.syllabus[0]?.lessons[1]?.duration).toBe("00:00");
    expect(mapped.syllabus[0]?.lessons[2]?.duration).toBe("00:00");
    expect(mapped.syllabus[0]?.lessons[0]?.content).toBeUndefined();
  });

  it("defaults syllabus to empty when backend payload omits it", () => {
    const mapped = mapApiCourseToFrontendCourse({
      id: "course_2",
      title: "German A1 Starter",
      description: "Description",
      price: 49,
      imageUrl: "https://example.com/course.jpg",
      status: "PUBLISHED",
      tutorId: "tutor_2",
      languageId: "lang_de",
      levelId: "level_a1",
      studentCount: 5,
      rating: 4.2,
      reviews: 3,
    } as any);

    expect(mapped.syllabus).toEqual([]);
    expect(mapped.imageUrl).toBe("https://example.com/course.jpg");
  });
});
