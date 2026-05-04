import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch";

const apiKey = "AIzaSyBioo_UmTbBTma_RfaOjbagGUXb66MVDK8";
const ai = new GoogleGenAI({ apiKey });
async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: "A shiny apple" }] }
    });
    console.log("Success with gemini-2.5-flash-image");
  } catch (e) {
    console.error("Failed gemini-2.5-flash-image:", e.status, e.message);
  }
}
test();
