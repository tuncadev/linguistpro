
export type GeneratedCourseDraft = {
  title: string;
  description: string;
  syllabus: string[];
  price: number;
};

export const generateCourseDetails = async (
  topic: string,
  language: string,
  level: string
): Promise<GeneratedCourseDraft | null> => {
  try {
    const response = await fetch("/api/ai/course-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, language, level }),
    });

    if (!response.ok) {
      console.error("Course draft endpoint returned non-OK status", response.status);
      return null;
    }

    const data = (await response.json()) as { draft?: GeneratedCourseDraft };
    return data.draft ?? null;
  } catch (error) {
    console.error("Course draft request error:", error);
    return null;
  }
};
