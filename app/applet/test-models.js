import { GoogleGenAI } from "@google/genai";

console.log("Key length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "imagen-3.0-generate-001",
      contents: { parts: [{ text: "A shiny apple" }] }
    });
    console.log("Success with imagen-3.0-generate-001");
  } catch (e) {
    console.error("Failed imagen:", e);
  }
}
test();
