
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCourseDetails = async (topic: string, language: string, level: string) => {
  try {
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
              items: { type: Type.STRING }
            },
            price: { type: Type.NUMBER }
          },
          required: ["title", "description", "syllabus", "price"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
