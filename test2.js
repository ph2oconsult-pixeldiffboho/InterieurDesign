import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI();
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: "A shiny apple" }] }
    });
    console.log("Success with gemini-2.5-flash-image");
  } catch (e) {
    console.error("Failed:", e.status, e.message);
  }
}
test();
