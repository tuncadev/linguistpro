import { GoogleGenAI, Type } from "@google/genai";

export type GeneratedCourseDraft = {
  title: string;
  description: string;
  syllabus: string[];
  price: number;
};

export async function generateCourseDraft(
  topic: string,
  language: string,
  level: string
): Promise<GeneratedCourseDraft | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is required on the server");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a detailed course description for a ${language} course about "${topic}" at ${level} level.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          syllabus: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          price: { type: Type.NUMBER },
        },
        required: ["title", "description", "syllabus", "price"],
      },
    },
  });

  try {
    const parsed = JSON.parse(response.text) as GeneratedCourseDraft;
    if (
      typeof parsed.title === "string" &&
      typeof parsed.description === "string" &&
      Array.isArray(parsed.syllabus) &&
      typeof parsed.price === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

