import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublishedCourses } from "../../services/courseApiService";

describe("fetchPublishedCourses integration", () => {
  const fetchMock = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    if (originalFetch) {
      vi.stubGlobal("fetch", originalFetch);
    } else {
      vi.unstubAllGlobals();
    }
  });

  it("returns mapped course list on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "course_1",
            title: "Spanish A2",
            description: "Desc",
            price: 79,
            imageUrl: null,
            tutorId: "tutor_1",
            languageId: "lang_es",
            levelId: "level_a2",
            studentCount: 10,
            rating: 4.5,
            reviews: 4,
            syllabus: [
              {
                id: "section_1",
                title: "Basics",
                position: 1,
                lessons: [
                  {
                    id: "lesson_1",
                    title: "Intro",
                    type: "video",
                    durationSeconds: 600,
                    content: null,
                  },
                ],
              },
            ],
          },
        ],
      }),
    } as Response);

    const courses = await fetchPublishedCourses();
    expect(courses).toHaveLength(1);
    expect(courses?.[0]?.title).toBe("Spanish A2");
    expect(courses?.[0]?.syllabus[0]?.lessons[0]?.duration).toBe("10:00");
    expect(fetchMock).toHaveBeenCalledWith("/api/courses");
  });

  it("returns null when API responds with non-OK status", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
    } as Response);

    const courses = await fetchPublishedCourses();
    expect(courses).toBeNull();
  });

  it("returns null when request throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("Network down"));

    const courses = await fetchPublishedCourses();
    expect(courses).toBeNull();

    errorSpy.mockRestore();
  });
});
