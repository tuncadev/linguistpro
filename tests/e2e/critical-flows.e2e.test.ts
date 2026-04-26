import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, verifySessionToken } from "../../lib/auth/session";
import { fetchPublishedCourses } from "../../services/courseApiService";

describe("critical flows e2e", () => {
  const originalAuthSecret = process.env.AUTH_SESSION_SECRET;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.AUTH_SESSION_SECRET = "e2e-session-secret";
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    if (originalAuthSecret === undefined) {
      delete process.env.AUTH_SESSION_SECRET;
    } else {
      process.env.AUTH_SESSION_SECRET = originalAuthSecret;
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalFetch) {
      vi.stubGlobal("fetch", originalFetch);
    } else {
      vi.unstubAllGlobals();
    }
  });

  it("supports tutor session and frontend course ingestion end-to-end", async () => {
    const token = await createSessionToken({
      id: "tutor_99",
      email: "tutor99@example.com",
      role: "TUTOR",
    });

    const session = await verifySessionToken(token);
    expect(session?.id).toBe("tutor_99");
    expect(session?.role).toBe("TUTOR");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "course_99",
              title: "French B2 Intensive",
              description: "Advanced speaking and writing",
              price: 199,
              imageUrl: null,
              tutorId: "tutor_99",
              languageId: "lang_fr",
              levelId: "level_b2",
              studentCount: 120,
              rating: 4.9,
              reviews: 87,
              syllabus: [
                {
                  id: "section_1",
                  title: "Advanced Fluency",
                  position: 1,
                  lessons: [
                    {
                      id: "lesson_1",
                      title: "Debate Warmup",
                      type: "reading",
                      durationSeconds: 780,
                      content: "Scenario prompts",
                    },
                  ],
                },
              ],
            },
          ],
        }),
      } as Response)
    );

    const courses = await fetchPublishedCourses();
    expect(courses).not.toBeNull();
    expect(courses?.[0]?.title).toBe("French B2 Intensive");
    expect(courses?.[0]?.syllabus[0]?.lessons[0]?.duration).toBe("13:00");
    expect(courses?.[0]?.syllabus[0]?.lessons[0]?.type).toBe("reading");
  });

  it("returns null safely when courses API is unavailable", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const courses = await fetchPublishedCourses();
    expect(courses).toBeNull();

    errorSpy.mockRestore();
  });
});
